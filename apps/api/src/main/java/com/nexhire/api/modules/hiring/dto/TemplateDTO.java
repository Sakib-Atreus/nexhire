package com.nexhire.api.modules.hiring.dto;

import java.time.Instant;
import java.util.UUID;

public record TemplateDTO(UUID id, String name, String body, Instant updatedAt) {}
