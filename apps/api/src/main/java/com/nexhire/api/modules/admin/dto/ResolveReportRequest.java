package com.nexhire.api.modules.admin.dto;

import com.nexhire.api.modules.admin.ReportStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** status must be RESOLVED or DISMISSED; hideJob also hides the reported job. */
public record ResolveReportRequest(
    @NotNull ReportStatus status,
    @Size(max = 1000) String note,
    boolean hideJob
) {}
