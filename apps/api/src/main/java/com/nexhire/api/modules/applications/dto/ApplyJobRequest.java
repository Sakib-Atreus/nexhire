package com.nexhire.api.modules.applications.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ApplyJobRequest(
    @NotNull UUID jobId,
    String coverLetter,
    String resumeUrl
) {}
