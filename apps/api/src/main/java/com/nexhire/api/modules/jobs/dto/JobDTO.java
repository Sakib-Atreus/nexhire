package com.nexhire.api.modules.jobs.dto;

import com.nexhire.api.modules.jobs.ExperienceLevel;
import com.nexhire.api.modules.jobs.JobStatus;
import com.nexhire.api.modules.jobs.JobType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record JobDTO(
    UUID id,
    String title,
    String description,
    String requirements,
    String responsibilities,
    String companyName,
    String companyLogoUrl,
    String location,
    JobType jobType,
    ExperienceLevel experienceLevel,
    BigDecimal salaryMin,
    BigDecimal salaryMax,
    String salaryCurrency,
    JobStatus status,
    String tags,
    LocalDate deadline,
    UUID recruiterId,
    String recruiterName,
    Instant createdAt,
    Instant updatedAt,
    int viewCount,
    String screeningQuestions,
    boolean isSaved,
    Integer applicationCount
) {}
