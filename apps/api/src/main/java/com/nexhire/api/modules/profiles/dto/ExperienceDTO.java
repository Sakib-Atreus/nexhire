package com.nexhire.api.modules.profiles.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

/** A role on the candidate's profile. endDate null = current role. id is ignored on save. */
public record ExperienceDTO(
    UUID id,
    @NotBlank(message = "Enter the job title") @Size(max = 150) String title,
    @NotBlank(message = "Enter the company") @Size(max = 150) String company,
    @Size(max = 150) String location,
    @NotNull(message = "Enter the start date") LocalDate startDate,
    LocalDate endDate,
    @Size(max = 3000) String description
) {}
