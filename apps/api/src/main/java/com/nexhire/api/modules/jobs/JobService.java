package com.nexhire.api.modules.jobs;

import com.nexhire.api.exception.ForbiddenException;
import com.nexhire.api.exception.ResourceNotFoundException;
import com.nexhire.api.modules.jobs.dto.CreateJobRequest;
import com.nexhire.api.modules.jobs.dto.JobDTO;
import com.nexhire.api.modules.jobs.dto.UpdateJobRequest;
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
public class JobService {

    private final JobRepository jobRepository;

    public Page<JobDTO> search(String keyword, String location, JobType jobType, ExperienceLevel experienceLevel, Pageable pageable) {
        return jobRepository.search(JobStatus.OPEN, keyword, location, jobType, experienceLevel, pageable).map(this::toDTO);
    }

    public Page<JobDTO> getAll(Pageable pageable) {
        return jobRepository.findAll(pageable).map(this::toDTO);
    }

    public JobDTO getById(UUID id) {
        return jobRepository.findById(id)
            .map(this::toDTO)
            .orElseThrow(() -> new ResourceNotFoundException("Job", "id", id));
    }

    public Page<JobDTO> getByRecruiter(UUID recruiterId, Pageable pageable) {
        return jobRepository.findByRecruiterId(recruiterId, pageable).map(this::toDTO);
    }

    @Transactional
    public JobDTO create(CreateJobRequest request, User recruiter) {
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
            .recruiter(recruiter)
            .status(JobStatus.OPEN)
            .build();

        return toDTO(jobRepository.save(job));
    }

    @Transactional
    public JobDTO update(UUID id, UpdateJobRequest request, User currentUser) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Job", "id", id));

        if (!job.getRecruiter().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You do not have permission to update this job");
        }

        if (request.title() != null) job.setTitle(request.title());
        if (request.description() != null) job.setDescription(request.description());
        if (request.requirements() != null) job.setRequirements(request.requirements());
        if (request.responsibilities() != null) job.setResponsibilities(request.responsibilities());
        if (request.companyLogoUrl() != null) job.setCompanyLogoUrl(request.companyLogoUrl());
        if (request.location() != null) job.setLocation(request.location());
        if (request.jobType() != null) job.setJobType(request.jobType());
        if (request.experienceLevel() != null) job.setExperienceLevel(request.experienceLevel());
        if (request.salaryMin() != null) job.setSalaryMin(request.salaryMin());
        if (request.salaryMax() != null) job.setSalaryMax(request.salaryMax());
        if (request.status() != null) job.setStatus(request.status());
        if (request.tags() != null) job.setTags(request.tags());
        if (request.deadline() != null) job.setDeadline(request.deadline());

        return toDTO(jobRepository.save(job));
    }

    @Transactional
    public void delete(UUID id, User currentUser) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Job", "id", id));

        if (!job.getRecruiter().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You do not have permission to delete this job");
        }

        jobRepository.deleteById(id);
    }

    public JobDTO toDTO(Job job) {
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
            job.getUpdatedAt()
        );
    }
}
