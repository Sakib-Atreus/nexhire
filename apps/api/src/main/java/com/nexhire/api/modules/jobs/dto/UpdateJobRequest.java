package com.nexhire.api.modules.jobs.dto;

import com.nexhire.api.modules.jobs.ExperienceLevel;
import com.nexhire.api.modules.jobs.JobStatus;
import com.nexhire.api.modules.jobs.JobType;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateJobRequest(
    @Size(max = 255) String title,
    String description,
    String requirements,
    String responsibilities,
    String companyLogoUrl,
    String location,
    JobType jobType,
    ExperienceLevel experienceLevel,
    BigDecimal salaryMin,
    BigDecimal salaryMax,
    String salaryCurrency,
    JobStatus status,
    String tags,
    LocalDate deadline
) {}
