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
    Instant updatedAt
) {}
