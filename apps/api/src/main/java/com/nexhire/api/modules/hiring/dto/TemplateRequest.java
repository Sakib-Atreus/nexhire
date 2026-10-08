package com.nexhire.api.modules.hiring.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TemplateRequest(
    @NotBlank(message = "Give the template a name") @Size(max = 100) String name,
    @NotBlank(message = "Write the message") @Size(max = 5000) String body
) {}
