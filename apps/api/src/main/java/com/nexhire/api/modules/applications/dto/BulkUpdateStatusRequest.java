package com.nexhire.api.modules.applications.dto;

import com.nexhire.api.modules.applications.ApplicationStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record BulkUpdateStatusRequest(
    @NotEmpty List<UUID> applicationIds,
    @NotNull ApplicationStatus status,
    String notes
) {}
