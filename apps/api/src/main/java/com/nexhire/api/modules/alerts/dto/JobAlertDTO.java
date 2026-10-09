package com.nexhire.api.modules.alerts.dto;

import com.nexhire.api.modules.alerts.AlertFrequency;
import com.nexhire.api.modules.jobs.ExperienceLevel;
import com.nexhire.api.modules.jobs.JobType;

import java.time.Instant;
import java.util.UUID;

public record JobAlertDTO(
    UUID id,
    String name,
    String keyword,
    String location,
    String category,
    JobType jobType,
    ExperienceLevel experienceLevel,
    AlertFrequency frequency,
    boolean active,
    boolean emailEnabled,
    /** Open jobs matching right now. */
    long currentMatches,
    Instant lastSentAt,
    Instant createdAt
) {}
