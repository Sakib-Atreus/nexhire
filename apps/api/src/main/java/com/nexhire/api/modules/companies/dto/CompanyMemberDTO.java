package com.nexhire.api.modules.companies.dto;

import java.time.Instant;
import java.util.UUID;

public record CompanyMemberDTO(
    UUID id,
    String fullName,
    String email,
    String avatarUrl,
    String headline,
    boolean owner,
    Instant joinedAt
) {}
