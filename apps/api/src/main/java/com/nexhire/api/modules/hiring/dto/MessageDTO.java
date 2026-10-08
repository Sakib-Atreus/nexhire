package com.nexhire.api.modules.hiring.dto;

import java.time.Instant;
import java.util.UUID;

public record MessageDTO(UUID id, UUID applicationId, UUID senderId, String senderName, boolean fromCandidate,
                         String body, Instant createdAt) {}
