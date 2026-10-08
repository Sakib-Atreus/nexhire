package com.nexhire.api.modules.admin.dto;

import com.nexhire.api.modules.admin.ReportReason;
import com.nexhire.api.modules.admin.ReportStatus;

import java.time.Instant;
import java.util.UUID;

public record JobReportDTO(
    UUID id,
    UUID jobId,
    String jobTitle,
    String companyName,
    boolean jobHidden,
    long openReportsForJob,
    UUID reporterId,
    String reporterName,
    String reporterEmail,
    ReportReason reason,
    String details,
    ReportStatus status,
    String resolutionNote,
    String resolvedByName,
    Instant resolvedAt,
    Instant createdAt
) {}
