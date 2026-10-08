package com.nexhire.api.modules.jobs.dto;

import java.util.List;

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
    @Size(max = 255) String companyName,
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
    List<String> screeningQuestions,
    @Size(max = 50) String category,
    @jakarta.validation.constraints.Min(1) @jakarta.validation.constraints.Max(500) Integer openings
) {}
