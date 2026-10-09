package com.nexhire.api.modules.timeline;

import com.nexhire.api.modules.applications.ApplicationStatus;

import java.time.Instant;
import java.util.UUID;

public record ApplicationEventDTO(
    UUID id,
    ApplicationEventType type,
    ApplicationStatus fromStatus,
    ApplicationStatus toStatus,
    String note,
    String actorName,
    Instant createdAt
) {}
