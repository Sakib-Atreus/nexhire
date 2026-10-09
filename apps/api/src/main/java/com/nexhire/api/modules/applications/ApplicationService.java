package com.nexhire.api.modules.applications;

import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.exception.ForbiddenException;
import com.nexhire.api.exception.ResourceNotFoundException;
import com.nexhire.api.modules.applications.dto.ApplicationDTO;
import com.nexhire.api.modules.applications.dto.ApplicationStatsDTO;
import com.nexhire.api.modules.applications.dto.ApplyJobRequest;
import com.nexhire.api.modules.applications.dto.BulkUpdateStatusRequest;
import com.nexhire.api.modules.applications.dto.UpdateApplicationStatusRequest;
import com.nexhire.api.modules.hiring.ApplicationMessageRepository;
import com.nexhire.api.modules.hiring.ApplicationNoteRepository;
import com.nexhire.api.modules.hiring.Interview;
import com.nexhire.api.modules.hiring.InterviewRepository;
import com.nexhire.api.modules.hiring.InterviewStatus;
import com.nexhire.api.modules.jobs.Job;
import com.nexhire.api.modules.jobs.JobAccess;
import com.nexhire.api.modules.jobs.JobRepository;
import com.nexhire.api.modules.jobs.JobStatus;
import com.nexhire.api.modules.notifications.NotificationService;
import com.nexhire.api.modules.timeline.ApplicationEventType;
import com.nexhire.api.modules.timeline.TimelineService;
import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final NotificationService notificationService;
    private final JobAccess jobAccess;
    private final InterviewRepository interviewRepository;
    private final ApplicationNoteRepository noteRepository;
    private final ApplicationMessageRepository messageRepository;
    private final TimelineService timelineService;

    @Transactional
    public ApplicationDTO apply(ApplyJobRequest request, User candidate) {
        Job job = jobRepository.findById(request.jobId())
            .orElseThrow(() -> new ResourceNotFoundException("Job", "id", request.jobId()));

        if (job.getStatus() != JobStatus.OPEN || job.isHidden()) {
            throw new BadRequestException("This job is not accepting applications");
        }

        if (applicationRepository.existsByJobIdAndCandidateId(job.getId(), candidate.getId())) {
            throw new BadRequestException("You have already applied for this job");
        }

        Application application = Application.builder()
            .job(job)
            .candidate(candidate)
            .coverLetter(request.coverLetter())
            .resumeUrl(request.resumeUrl())
            .status(ApplicationStatus.PENDING)
            .build();

        Application saved = applicationRepository.save(application);
        timelineService.record(saved.getId(), ApplicationEventType.APPLIED, null, ApplicationStatus.PENDING, null, candidate);

        notificationService.notifyApplicationReceived(saved);

        return toCandidateDTO(saved);
    }

    public Page<ApplicationDTO> getMyApplications(UUID candidateId, Pageable pageable) {
        return applicationRepository.findByCandidateId(candidateId, pageable).map(this::toCandidateDTO);
    }

    public Optional<ApplicationDTO> getMyApplicationForJob(UUID jobId, UUID candidateId) {
        return applicationRepository.findByJobIdAndCandidateId(jobId, candidateId).map(this::toCandidateDTO);
    }

    public Page<ApplicationDTO> getJobApplications(UUID jobId, User currentUser, Pageable pageable) {
        Job job = jobRepository.findById(jobId)
            .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

        if (!jobAccess.canManage(job, currentUser)) {
            throw new ForbiddenException("You do not have permission to view these applications");
        }

        return applicationRepository.findByJobId(jobId, pageable).map(this::toDTO);
    }

    /** Applications across every job the recruiter manages (own + company team). */
    public Page<ApplicationDTO> getRecruiterApplications(User recruiter, Pageable pageable) {
        return applicationRepository.findManagedBy(recruiter.getId(), JobAccess.companyOrNone(recruiter), pageable)
            .map(this::toDTO);
    }

    @Transactional
    public ApplicationDTO updateStatus(UUID applicationId, UpdateApplicationStatusRequest request, User currentUser) {
        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Application", "id", applicationId));

        boolean isOwner = application.getCandidate().getId().equals(currentUser.getId());

        if (request.status() == ApplicationStatus.WITHDRAWN) {
            if (!isOwner) throw new ForbiddenException("Only the applicant can withdraw an application");
        } else {
            requireManage(application, currentUser);
            if (application.getStatus() == ApplicationStatus.WITHDRAWN) {
                throw new BadRequestException("This candidate withdrew their application");
            }
        }

        ApplicationStatus previous = application.getStatus();
        application.setStatus(request.status());
        if (request.notes() != null) application.setNotes(request.notes());

        Application saved = applicationRepository.save(application);
        if (previous != saved.getStatus()) {
            // request.notes is the hiring team's message to the candidate shown on the timeline.
            timelineService.record(saved.getId(),
                saved.getStatus() == ApplicationStatus.WITHDRAWN ? ApplicationEventType.WITHDRAWN : ApplicationEventType.STATUS_CHANGED,
                previous, saved.getStatus(), isOwner ? null : request.notes(), currentUser);
            notificationService.notifyApplicationStatusChanged(saved);
        }
        if (saved.getStatus() == ApplicationStatus.HIRED) closeIfFilled(saved.getJob());

        return isOwner ? toCandidateDTO(saved) : toDTO(saved);
    }

    @Transactional
    public List<ApplicationDTO> bulkUpdateStatus(BulkUpdateStatusRequest request, User currentUser) {
        if (request.status() == ApplicationStatus.WITHDRAWN) {
            throw new BadRequestException("Only the applicant can withdraw an application");
        }
        List<Application> apps = applicationRepository.findAllById(request.applicationIds());
        if (apps.stream().anyMatch(app -> !jobAccess.canManage(app.getJob(), currentUser))) {
            throw new ForbiddenException("You do not have permission to update one or more of the selected applications");
        }
        List<Application> changed = apps.stream()
            .filter(app -> app.getStatus() != ApplicationStatus.WITHDRAWN && app.getStatus() != request.status())
            .toList();
        changed.forEach(app -> {
            timelineService.record(app.getId(), ApplicationEventType.STATUS_CHANGED, app.getStatus(), request.status(),
                request.notes(), currentUser);
            app.setStatus(request.status());
            if (request.notes() != null) app.setNotes(request.notes());
        });
        List<Application> saved = applicationRepository.saveAll(changed);
        saved.forEach(notificationService::notifyApplicationStatusChanged);
        if (request.status() == ApplicationStatus.HIRED) {
            saved.stream().map(Application::getJob).distinct().forEach(this::closeIfFilled);
        }
        return apps.stream().map(this::toDTO).toList();
    }

    /** Private 1–5 rating (null clears it). */
    @Transactional
    public ApplicationDTO rate(UUID applicationId, Integer rating, User currentUser) {
        if (rating != null && (rating < 1 || rating > 5)) throw new BadRequestException("Rating must be between 1 and 5");
        Application application = getManaged(applicationId, currentUser);
        application.setRating(rating);
        return toDTO(applicationRepository.save(application));
    }

    public long countByCandidate(UUID candidateId) {
        return applicationRepository.countByCandidateId(candidateId);
    }

    public List<ApplicationDTO> recentByCandidate(UUID candidateId) {
        return applicationRepository.findTop5ByCandidateIdOrderByAppliedAtDesc(candidateId).stream().map(this::toDTO).toList();
    }

    public ApplicationStatsDTO getRecruiterStats(User recruiter) {
        if (recruiter.getRole() == Role.ADMIN) {
            return new ApplicationStatsDTO(
                applicationRepository.countByStatus(ApplicationStatus.PENDING),
                applicationRepository.countByStatus(ApplicationStatus.REVIEWING),
                applicationRepository.countByStatus(ApplicationStatus.SHORTLISTED),
                applicationRepository.countByStatus(ApplicationStatus.INTERVIEWED),
                applicationRepository.countByStatus(ApplicationStatus.OFFERED),
                applicationRepository.countByStatus(ApplicationStatus.HIRED),
                applicationRepository.countByStatus(ApplicationStatus.REJECTED),
                applicationRepository.countByStatus(ApplicationStatus.WITHDRAWN),
                applicationRepository.count()
            );
        }
        UUID uid = recruiter.getId();
        UUID cid = JobAccess.companyOrNone(recruiter);
        return new ApplicationStatsDTO(
            applicationRepository.countManagedByStatus(uid, cid, ApplicationStatus.PENDING),
            applicationRepository.countManagedByStatus(uid, cid, ApplicationStatus.REVIEWING),
            applicationRepository.countManagedByStatus(uid, cid, ApplicationStatus.SHORTLISTED),
            applicationRepository.countManagedByStatus(uid, cid, ApplicationStatus.INTERVIEWED),
            applicationRepository.countManagedByStatus(uid, cid, ApplicationStatus.OFFERED),
            applicationRepository.countManagedByStatus(uid, cid, ApplicationStatus.HIRED),
            applicationRepository.countManagedByStatus(uid, cid, ApplicationStatus.REJECTED),
            applicationRepository.countManagedByStatus(uid, cid, ApplicationStatus.WITHDRAWN),
            applicationRepository.countManaged(uid, cid)
        );
    }

    // ─── Access helpers (also used by the hiring tools) ─────────────────────

    public Application getManaged(UUID applicationId, User user) {
        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Application", "id", applicationId));
        requireManage(application, user);
        return application;
    }

    /** The application if the user is its candidate or on its hiring team. */
    public Application getParticipating(UUID applicationId, User user) {
        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Application", "id", applicationId));
        boolean isCandidate = application.getCandidate().getId().equals(user.getId());
        if (!isCandidate && !jobAccess.canManage(application.getJob(), user)) {
            throw new ForbiddenException("You do not have access to this application");
        }
        return application;
    }

    private void requireManage(Application application, User user) {
        if (!jobAccess.canManage(application.getJob(), user)) {
            throw new ForbiddenException("Only the hiring team can manage this application");
        }
    }

    /** Mark the job FILLED once it has as many hires as openings. */
    private void closeIfFilled(Job job) {
        if (job.getStatus() != JobStatus.OPEN) return;
        long hired = applicationRepository.countByJobIdAndStatus(job.getId(), ApplicationStatus.HIRED);
        if (hired >= job.getOpenings()) {
            job.setStatus(JobStatus.FILLED);
            job.setFeatured(false);
            jobRepository.save(job);
        }
    }

    // ─── DTOs ───────────────────────────────────────────────────────────────

    /** Hiring-team view, including the private rating and note count. */
    public ApplicationDTO toDTO(Application application) {
        return toDTO(application, true);
    }

    /** Candidate view: private hiring-team fields are left out. */
    public ApplicationDTO toCandidateDTO(Application application) {
        return toDTO(application, false);
    }

    private ApplicationDTO toDTO(Application application, boolean hiringTeam) {
        User candidate = application.getCandidate();
        Optional<Interview> next = interviewRepository
            .findFirstByApplicationIdAndStatusAndScheduledAtAfterOrderByScheduledAtAsc(application.getId(), InterviewStatus.SCHEDULED, Instant.now());
        return new ApplicationDTO(
            application.getId(),
            application.getJob().getId(),
            application.getJob().getTitle(),
            application.getJob().getCompanyName(),
            candidate.getId(),
            candidate.getFullName(),
            candidate.getEmail(),
            application.getCoverLetter(),
            application.getResumeUrl(),
            application.getStatus(),
            application.getNotes(),
            application.getAppliedAt(),
            application.getUpdatedAt(),
            candidate.getAvatarUrl(),
            candidate.getHeadline(),
            next.map(Interview::getScheduledAt).orElse(null),
            next.map(Interview::getResponse).orElse(null),
            hiringTeam ? application.getRating() : null,
            hiringTeam ? noteRepository.countByApplicationId(application.getId()) : null,
            messageRepository.countByApplicationId(application.getId())
        );
    }
}
