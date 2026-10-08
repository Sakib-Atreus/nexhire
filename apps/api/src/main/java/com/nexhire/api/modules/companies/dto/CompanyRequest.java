package com.nexhire.api.modules.companies.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompanyRequest(
    @NotBlank(message = "Enter the company name") @Size(max = 255) String name,
    @Size(max = 500) String logoUrl,
    @Size(max = 500) String website,
    @Size(max = 20) String size,
    @Size(max = 100) String industry,
    @Size(max = 255) String headquarters,
    @Size(max = 5000, message = "Keep the description under 5,000 characters") String description
) {}
