package com.nexhire.api.modules.applications.dto;

import com.nexhire.api.modules.applications.ApplicationStatus;

import java.time.Instant;
import java.util.UUID;

public record ApplicationDTO(
    UUID id,
    UUID jobId,
    String jobTitle,
    String companyName,
    UUID candidateId,
    String candidateName,
    String candidateEmail,
    String coverLetter,
    String resumeUrl,
    ApplicationStatus status,
    String notes,
    Instant appliedAt,
    Instant updatedAt,
    String candidateAvatarUrl,
    String candidateHeadline,
    /** Next scheduled interview, if any. */
    Instant nextInterviewAt,
    /** The candidate's response to that next interview (AWAITING, ACCEPTED, NEW_TIME_REQUESTED, DECLINED). */
    com.nexhire.api.modules.hiring.InterviewResponse nextInterviewResponse,
    /** Hiring-team only (null for the candidate). */
    Integer rating,
    /** Hiring-team only (null for the candidate). */
    Long noteCount,
    long messageCount
) {}
