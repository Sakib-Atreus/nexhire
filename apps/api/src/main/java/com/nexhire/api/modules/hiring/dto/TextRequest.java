package com.nexhire.api.modules.hiring.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TextRequest(@NotBlank(message = "Write something first") @Size(max = 5000) String body) {}
