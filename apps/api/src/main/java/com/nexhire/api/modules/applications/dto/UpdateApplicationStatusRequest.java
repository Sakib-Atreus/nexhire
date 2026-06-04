package com.nexhire.api.modules.applications.dto;

import com.nexhire.api.modules.applications.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateApplicationStatusRequest(
    @NotNull ApplicationStatus status,
    String notes
) {}
