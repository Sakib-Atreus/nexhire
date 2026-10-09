package com.nexhire.api.modules.hiring.dto;

import java.time.Instant;
import java.util.UUID;

/** Everything the call page needs to join an interview's video room. */
public record VideoJoinDTO(
    UUID interviewId,
    String roomUrl,
    String token,
    boolean owner,
    String userName,
    String jobTitle,
    String companyName,
    String candidateName,
    Instant scheduledAt,
    int durationMinutes
) {}
