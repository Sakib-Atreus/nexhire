package com.nexhire.api.modules.jobs.dto;

import com.nexhire.api.modules.jobs.JobStatus;
import jakarta.validation.constraints.Size;

/** Admin moderation: every field is optional; only provided ones change. */
public record JobModerationRequest(
    Boolean hidden,
    Boolean featured,
    JobStatus status,
    @Size(max = 500) String reason
) {}
