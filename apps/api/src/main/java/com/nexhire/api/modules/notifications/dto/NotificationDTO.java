package com.nexhire.api.modules.notifications.dto;

import com.nexhire.api.modules.notifications.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationDTO(
    UUID id,
    NotificationType type,
    String title,
    String message,
    boolean read,
    UUID referenceId,
    String referenceType,
    Instant createdAt
) {}
