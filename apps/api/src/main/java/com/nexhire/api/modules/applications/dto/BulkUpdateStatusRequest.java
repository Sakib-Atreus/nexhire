package com.nexhire.api.modules.applications.dto;

import com.nexhire.api.modules.applications.ApplicationStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record BulkUpdateStatusRequest(
    @NotEmpty @jakarta.validation.constraints.Size(max = 100, message = "Update at most 100 applications at a time") List<UUID> applicationIds,
    @NotNull ApplicationStatus status,
    String notes
) {}
