package com.nexhire.api.modules.hiring.dto;

import com.nexhire.api.modules.hiring.InterviewStatus;
import com.nexhire.api.modules.hiring.InterviewType;

import java.time.Instant;
import java.util.UUID;

public record InterviewDTO(
    UUID id,
    UUID applicationId,
    UUID jobId,
    String jobTitle,
    String companyName,
    UUID candidateId,
    String candidateName,
    Instant scheduledAt,
    int durationMinutes,
    InterviewType type,
    String location,
    String message,
    InterviewStatus status,
    Instant createdAt,
    com.nexhire.api.modules.hiring.InterviewResponse response,
    String responseNote,
    java.util.List<Instant> proposedTimes,
    Instant respondedAt,
    Instant invitedAt,
    /** Scheduled, still awaiting a reply 48h after the invite, and not yet past. */
    boolean needsFollowUp
) {}
