package com.nexhire.api.modules.admin.dto;

import com.nexhire.api.modules.admin.ReportReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReportRequest(
    @NotNull ReportReason reason,
    @Size(max = 1000) String details
) {}
