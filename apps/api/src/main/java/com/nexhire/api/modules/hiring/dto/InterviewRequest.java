package com.nexhire.api.modules.hiring.dto;

import com.nexhire.api.modules.hiring.InterviewStatus;
import com.nexhire.api.modules.hiring.InterviewType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/** Create: scheduledAt and type required. Update: every field optional. */
public record InterviewRequest(
    Instant scheduledAt,
    @Min(5) @Max(480) Integer durationMinutes,
    InterviewType type,
    @Size(max = 500) String location,
    @Size(max = 2000) String message,
    InterviewStatus status,
    /** Save even if it overlaps other interviews (after the user has seen the clash warning). */
    Boolean allowConflicts
) {}
