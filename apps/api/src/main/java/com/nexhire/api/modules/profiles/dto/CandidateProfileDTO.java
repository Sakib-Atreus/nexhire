package com.nexhire.api.modules.profiles.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A candidate's profile as shown publicly (/p/{slug}) or to a hiring team they applied to.
 * Contact details (email, phone) and the resume are only filled in for the hiring team.
 */
public record CandidateProfileDTO(
    UUID id,
    String fullName,
    String headline,
    String location,
    String bio,
    String avatarUrl,
    List<String> skills,
    List<String> portfolioLinks,
    boolean openToWork,
    List<ExperienceDTO> experience,
    List<EducationDTO> education,
    Instant memberSince,
    String email,
    String phone,
    String resumeUrl,
    String profileSlug
) {}
