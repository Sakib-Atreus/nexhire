package com.nexhire.api.modules.jobs.dto;

import com.nexhire.api.modules.jobs.ExperienceLevel;
import com.nexhire.api.modules.jobs.JobType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateJobRequest(
    @NotBlank @Size(max = 255) String title,
    @NotBlank String description,
    String requirements,
    String responsibilities,
    @NotBlank @Size(max = 255) String companyName,
    String companyLogoUrl,
    String location,
    @NotNull JobType jobType,
    @NotNull ExperienceLevel experienceLevel,
    BigDecimal salaryMin,
    BigDecimal salaryMax,
    String salaryCurrency,
    String tags,
    LocalDate deadline
) {}
