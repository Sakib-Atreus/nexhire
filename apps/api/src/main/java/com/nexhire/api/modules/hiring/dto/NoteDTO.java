package com.nexhire.api.modules.hiring.dto;

import java.time.Instant;
import java.util.UUID;

public record NoteDTO(UUID id, UUID applicationId, UUID authorId, String authorName, String body, Instant createdAt) {}
