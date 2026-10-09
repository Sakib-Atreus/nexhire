package com.nexhire.api.modules.profiles.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/** id is ignored on save. */
public record EducationDTO(
    UUID id,
    @NotBlank(message = "Enter the school") @Size(max = 150) String school,
    @Size(max = 150) String degree,
    @Size(max = 150) String fieldOfStudy,
    @Min(1950) @Max(2100) Integer startYear,
    @Min(1950) @Max(2100) Integer endYear,
    @Size(max = 2000) String description
) {}
