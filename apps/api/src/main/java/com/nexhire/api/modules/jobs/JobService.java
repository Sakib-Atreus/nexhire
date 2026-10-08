package com.nexhire.api.modules.jobs;

import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.exception.ForbiddenException;
import com.nexhire.api.exception.ResourceNotFoundException;
import com.nexhire.api.modules.jobs.dto.CreateJobRequest;
import com.nexhire.api.modules.jobs.dto.JobDTO;
import com.nexhire.api.modules.jobs.dto.UpdateJobRequest;
import com.nexhire.api.modules.admin.AuditAction;
import com.nexhire.api.modules.admin.AuditService;
import com.nexhire.api.modules.applications.ApplicationRepository;
import com.nexhire.api.modules.notifications.NotificationService;
import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.nexhire.api.modules.jobs.dto.JobModerationRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobService {

    private final JobRepository jobRepository;
    private final SavedJobRepository savedJobRepository;
    private final NotificationService notificationService;
    private final ApplicationRepository applicationRepository;
    private final ObjectMapper objectMapper;
    private final AuditService auditService;

    public Page<JobDTO> search(String keyword, String location, String companyName, JobType jobType, ExperienceLevel experienceLevel,
                               BigDecimal salaryMin, BigDecimal salaryMax, String category, boolean featuredOnly,
                               Pageable pageable, UUID currentUserId) {
        String cat = category == null || category.isBlank() ? null : category.trim();
        return jobRepository.searchExtended(JobStatus.OPEN, keyword, location, companyName, jobType, experienceLevel,
                salaryMin, salaryMax, cat, featuredOnly, pageable)
            .map(j -> toDTO(j, currentUserId));
    }

    public Page<JobDTO> getAll(Pageable pageable) {
        return jobRepository.findAll(pageable).map(j -> toDTO(j, null));
    }

    @Transactional
    public JobDTO getById(UUID id) {
        jobRepository.incrementViewCount(id);
        return jobRepository.findById(id)
            .map(j -> toDTO(j, null))
            .orElseThrow(() -> new ResourceNotFoundException("Job", "id", id));
    }

    /** Job detail; hidden (moderated) jobs are only visible to their recruiter and admins. */
    @Transactional
    public JobDTO getByIdForUser(UUID id, User currentUser) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Job", "id", id));
        boolean canSeeHidden = currentUser != null
            && (currentUser.getRole() == Role.ADMIN || job.getRecruiter().getId().equals(currentUser.getId()));
        if (job.isHidden() && !canSeeHidden) {
            throw new ResourceNotFoundException("Job", "id", id);
        }
        jobRepository.incrementViewCount(id);
        return toDTO(job, currentUser != null ? currentUser.getId() : null);
    }

    public Page<JobDTO> getByRecruiter(UUID recruiterId, Pageable pageable) {
        return jobRepository.findByRecruiterId(recruiterId, pageable)
            .map(j -> toDTO(j, null, (int) applicationRepository.countByJobId(j.getId())));
    }

    @Transactional
    public JobDTO create(CreateJobRequest request, User recruiter) {
        if (request.salaryMin() != null && request.salaryMax() != null
                && request.salaryMin().compareTo(request.salaryMax()) > 0) {
            throw new BadRequestException("Minimum salary cannot be greater than maximum salary");
        }
        Job job = Job.builder()
            .title(request.title())
            .description(request.description())
            .requirements(request.requirements())
            .responsibilities(request.responsibilities())
            .companyName(request.companyName())
            .companyLogoUrl(request.companyLogoUrl())
            .location(request.location())
            .jobType(request.jobType())
            .experienceLevel(request.experienceLevel())
            .salaryMin(request.salaryMin())
            .salaryMax(request.salaryMax())
            .salaryCurrency(request.salaryCurrency() != null ? request.salaryCurrency() : "USD")
            .tags(request.tags())
            .deadline(request.deadline())
            .screeningQuestions(toJson(request.screeningQuestions()))
            .category(blankToNull(request.category()))
            .recruiter(recruiter)
            .status(JobStatus.OPEN)
            .build();

        return toDTO(jobRepository.save(job), null);
    }

    @Transactional
    public JobDTO update(UUID id, UpdateJobRequest request, User currentUser) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Job", "id", id));

        if (!job.getRecruiter().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You do not have permission to update this job");
        }

        BigDecimal effectiveMin = request.salaryMin() != null ? request.salaryMin() : job.getSalaryMin();
        BigDecimal effectiveMax = request.salaryMax() != null ? request.salaryMax() : job.getSalaryMax();
        if (effectiveMin != null && effectiveMax != null && effectiveMin.compareTo(effectiveMax) > 0) {
            throw new BadRequestException("Minimum salary cannot be greater than maximum salary");
        }

        if (request.title() != null) job.setTitle(request.title());
        if (request.description() != null) job.setDescription(request.description());
        if (request.requirements() != null) job.setRequirements(request.requirements());
        if (request.responsibilities() != null) job.setResponsibilities(request.responsibilities());
        if (request.companyName() != null && !request.companyName().isBlank()) job.setCompanyName(request.companyName());
        if (request.companyLogoUrl() != null) job.setCompanyLogoUrl(request.companyLogoUrl());
        if (request.location() != null) job.setLocation(request.location());
        if (request.jobType() != null) job.setJobType(request.jobType());
        if (request.experienceLevel() != null) job.setExperienceLevel(request.experienceLevel());
        if (request.salaryMin() != null) job.setSalaryMin(request.salaryMin());
        if (request.salaryMax() != null) job.setSalaryMax(request.salaryMax());
        if (request.salaryCurrency() != null && !request.salaryCurrency().isBlank()) job.setSalaryCurrency(request.salaryCurrency());
        if (request.screeningQuestions() != null) job.setScreeningQuestions(toJson(request.screeningQuestions()));
        if (request.category() != null) job.setCategory(blankToNull(request.category()));
        if (request.status() != null) job.setStatus(request.status());
        if (request.tags() != null) job.setTags(request.tags());
        if (request.deadline() != null) job.setDeadline(request.deadline());

        return toDTO(jobRepository.save(job), null);
    }

    @Transactional
    public void delete(UUID id, User currentUser) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Job", "id", id));

        if (!job.getRecruiter().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You do not have permission to delete this job");
        }

        jobRepository.deleteById(id);
        if (!job.getRecruiter().getId().equals(currentUser.getId())) {
            auditService.record(currentUser, AuditAction.JOB_DELETED, AuditService.TARGET_JOB, id,
                job.getTitle() + " · " + job.getCompanyName(), null);
        }
    }

    @Transactional
    public JobDTO saveJob(UUID jobId, User user) {
        if (savedJobRepository.existsByUserIdAndJobId(user.getId(), jobId)) {
            throw new BadRequestException("Job already saved");
        }
        Job job = jobRepository.findById(jobId)
            .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));
        savedJobRepository.save(SavedJob.builder().user(user).job(job).build());
        return toDTO(job, user.getId());
    }

    @Transactional
    public void unsaveJob(UUID jobId, UUID userId) {
        savedJobRepository.deleteByUserIdAndJobId(userId, jobId);
    }

    public Page<JobDTO> getSavedJobs(UUID userId, Pageable pageable) {
        return savedJobRepository.findByUserId(userId, pageable).map(sj -> toDTO(sj.getJob(), userId));
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void autoCloseExpiredJobs() {
        List<Job> expired = jobRepository.findExpiredOpenJobs(LocalDate.now());
        expired.forEach(j -> j.setStatus(JobStatus.CLOSED));
        jobRepository.saveAll(expired);
        if (!expired.isEmpty()) {
            expired.forEach(j -> notificationService.notifyJobExpired(j));
            log.info("Auto-closed {} expired jobs", expired.size());
        }
    }

    public JobDTO toDTO(Job job, UUID currentUserId) {
        return toDTO(job, currentUserId, null);
    }

    public JobDTO toDTO(Job job, UUID currentUserId, Integer applicationCount) {
        boolean saved = currentUserId != null && savedJobRepository.existsByUserIdAndJobId(currentUserId, job.getId());
        return new JobDTO(
            job.getId(),
            job.getTitle(),
            job.getDescription(),
            job.getRequirements(),
            job.getResponsibilities(),
            job.getCompanyName(),
            job.getCompanyLogoUrl(),
            job.getLocation(),
            job.getJobType(),
            job.getExperienceLevel(),
            job.getSalaryMin(),
            job.getSalaryMax(),
            job.getSalaryCurrency(),
            job.getStatus(),
            job.getTags(),
            job.getDeadline(),
            job.getRecruiter().getId(),
            job.getRecruiter().getFullName(),
            job.getCreatedAt(),
            job.getUpdatedAt(),
            job.getViewCount(),
            parseQuestions(job.getScreeningQuestions()),
            saved,
            applicationCount,
            job.getCategory(),
            job.isFeatured(),
            job.isHidden(),
            job.getRecruiter().isVerified()
        );
    }

    private List<String> parseQuestions(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private String toJson(List<String> questions) {
        if (questions == null) return "[]";
        try {
            return objectMapper.writeValueAsString(
                questions.stream().filter(q -> q != null && !q.isBlank()).map(String::trim).toList());
        } catch (Exception e) {
            return "[]";
        }
    }

    // ─── Admin ──────────────────────────────────────────────────────────────

    /** Every job on the platform (including hidden and closed), filtered for the admin moderation table. */
    public Page<JobDTO> adminSearch(String q, JobStatus status, Boolean hidden, Boolean featured, String category,
                                    UUID recruiterId, Pageable pageable) {
        Specification<Job> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase() + "%";
                p.add(cb.or(cb.like(cb.lower(root.get("title")), like), cb.like(cb.lower(root.get("companyName")), like)));
            }
            if (status != null) p.add(cb.equal(root.get("status"), status));
            if (hidden != null) p.add(cb.equal(root.get("hidden"), hidden));
            if (featured != null) p.add(cb.equal(root.get("featured"), featured));
            if (category != null && !category.isBlank()) p.add(cb.equal(root.get("category"), category.trim()));
            if (recruiterId != null) p.add(cb.equal(root.get("recruiter").get("id"), recruiterId));
            return cb.and(p.toArray(Predicate[]::new));
        };
        Pageable sorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
        return jobRepository.findAll(spec, sorted)
            .map(j -> toDTO(j, null, (int) applicationRepository.countByJobId(j.getId())));
    }

    /** Hide/unhide, feature/unfeature or change the status of any job, recording each change. */
    @Transactional
    public JobDTO moderate(UUID id, JobModerationRequest request, User admin) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Job", "id", id));
        String label = job.getTitle() + " · " + job.getCompanyName();
        String reason = request.reason() == null || request.reason().isBlank() ? null : request.reason().trim();

        if (request.hidden() != null && request.hidden() != job.isHidden()) {
            job.setHidden(request.hidden());
            if (request.hidden()) job.setFeatured(false);
            auditService.record(admin, request.hidden() ? AuditAction.JOB_HIDDEN : AuditAction.JOB_UNHIDDEN,
                AuditService.TARGET_JOB, id, label, reason);
        }
        if (request.featured() != null && request.featured() != job.isFeatured()) {
            if (request.featured() && (job.isHidden() || job.getStatus() != JobStatus.OPEN)) {
                throw new BadRequestException("Only open, visible jobs can be featured");
            }
            job.setFeatured(request.featured());
            auditService.record(admin, request.featured() ? AuditAction.JOB_FEATURED : AuditAction.JOB_UNFEATURED,
                AuditService.TARGET_JOB, id, label, reason);
        }
        if (request.status() != null && request.status() != job.getStatus()) {
            JobStatus previous = job.getStatus();
            job.setStatus(request.status());
            if (request.status() != JobStatus.OPEN) job.setFeatured(false);
            auditService.record(admin, AuditAction.JOB_STATUS_CHANGED, AuditService.TARGET_JOB, id, label,
                previous + " → " + request.status() + (reason != null ? " (" + reason + ")" : ""));
        }
        return toDTO(jobRepository.save(job), null, (int) applicationRepository.countByJobId(id));
    }

    public long countByRecruiter(UUID recruiterId) {
        return jobRepository.countByRecruiterId(recruiterId);
    }

    public List<JobDTO> recentByRecruiter(UUID recruiterId) {
        return jobRepository.findTop5ByRecruiterIdOrderByCreatedAtDesc(recruiterId).stream()
            .map(j -> toDTO(j, null, (int) applicationRepository.countByJobId(j.getId())))
            .toList();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
