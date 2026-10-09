package com.nexhire.api.modules.alerts.dto;

import com.nexhire.api.modules.alerts.AlertFrequency;
import com.nexhire.api.modules.jobs.ExperienceLevel;
import com.nexhire.api.modules.jobs.JobType;
import jakarta.validation.constraints.Size;

/** At least one of keyword, location, category, jobType or experienceLevel is required. */
public record JobAlertRequest(
    @Size(max = 100) String name,
    @Size(max = 100) String keyword,
    @Size(max = 100) String location,
    @Size(max = 50) String category,
    JobType jobType,
    ExperienceLevel experienceLevel,
    AlertFrequency frequency,
    Boolean active,
    Boolean emailEnabled
) {}
