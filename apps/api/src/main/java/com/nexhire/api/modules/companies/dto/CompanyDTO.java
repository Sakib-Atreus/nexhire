package com.nexhire.api.modules.companies.dto;

import java.time.Instant;
import java.util.UUID;

public record CompanyDTO(
    UUID id,
    String slug,
    String name,
    String logoUrl,
    String website,
    String size,
    String industry,
    String headquarters,
    String description,
    boolean verified,
    long openJobs,
    long members,
    Instant createdAt
) {}
