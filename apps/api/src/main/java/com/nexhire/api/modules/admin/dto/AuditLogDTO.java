package com.nexhire.api.modules.admin.dto;

import com.nexhire.api.modules.admin.AuditAction;

import java.time.Instant;
import java.util.UUID;

public record AuditLogDTO(
    UUID id,
    UUID actorId,
    String actorName,
    String actorEmail,
    AuditAction action,
    String targetType,
    UUID targetId,
    String targetLabel,
    String details,
    Instant createdAt
) {}
