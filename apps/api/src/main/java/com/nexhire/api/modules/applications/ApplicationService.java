package com.nexhire.api.modules.applications;

import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.exception.ForbiddenException;
import com.nexhire.api.exception.ResourceNotFoundException;
import com.nexhire.api.modules.applications.dto.ApplicationDTO;
import com.nexhire.api.modules.applications.dto.ApplyJobRequest;
import com.nexhire.api.modules.applications.dto.UpdateApplicationStatusRequest;
import com.nexhire.api.modules.jobs.Job;
import com.nexhire.api.modules.jobs.JobRepository;
import com.nexhire.api.modules.jobs.JobStatus;
import com.nexhire.api.modules.notifications.NotificationService;
import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final NotificationService notificationService;

    @Transactional
    public ApplicationDTO apply(ApplyJobRequest request, User candidate) {
        Job job = jobRepository.findById(request.jobId())
            .orElseThrow(() -> new ResourceNotFoundException("Job", "id", request.jobId()));

        if (job.getStatus() != JobStatus.OPEN) {
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

        notificationService.notifyApplicationReceived(saved);

        return toDTO(saved);
    }

    public Page<ApplicationDTO> getMyApplications(UUID candidateId, Pageable pageable) {
        return applicationRepository.findByCandidateId(candidateId, pageable).map(this::toDTO);
    }

    public Page<ApplicationDTO> getJobApplications(UUID jobId, User currentUser, Pageable pageable) {
        Job job = jobRepository.findById(jobId)
            .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

        if (!job.getRecruiter().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You do not have permission to view these applications");
        }

        return applicationRepository.findByJobId(jobId, pageable).map(this::toDTO);
    }

    public Page<ApplicationDTO> getRecruiterApplications(UUID recruiterId, Pageable pageable) {
        return applicationRepository.findByJobRecruiterId(recruiterId, pageable).map(this::toDTO);
    }

    @Transactional
    public ApplicationDTO updateStatus(UUID applicationId, UpdateApplicationStatusRequest request, User currentUser) {
        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Application", "id", applicationId));

        boolean isRecruiter = application.getJob().getRecruiter().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isOwner = application.getCandidate().getId().equals(currentUser.getId());

        if (request.status() == ApplicationStatus.WITHDRAWN) {
            if (!isOwner) throw new ForbiddenException("Only the applicant can withdraw an application");
        } else {
            if (!isRecruiter && !isAdmin) throw new ForbiddenException("Only the recruiter can update application status");
        }

        application.setStatus(request.status());
        if (request.notes() != null) application.setNotes(request.notes());

        Application saved = applicationRepository.save(application);
        notificationService.notifyApplicationStatusChanged(saved);

        return toDTO(saved);
    }

    public ApplicationDTO toDTO(Application application) {
        return new ApplicationDTO(
            application.getId(),
            application.getJob().getId(),
            application.getJob().getTitle(),
            application.getJob().getCompanyName(),
            application.getCandidate().getId(),
            application.getCandidate().getFullName(),
            application.getCandidate().getEmail(),
            application.getCoverLetter(),
            application.getResumeUrl(),
            application.getStatus(),
            application.getNotes(),
            application.getAppliedAt(),
            application.getUpdatedAt()
        );
    }
}
