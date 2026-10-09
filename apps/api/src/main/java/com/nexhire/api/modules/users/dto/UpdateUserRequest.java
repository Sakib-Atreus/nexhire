package com.nexhire.api.modules.users.dto;

import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateUserRequest(
    @Size(max = 100) String firstName,
    @Size(max = 100) String lastName,
    @Size(max = 20) String phone,
    @Size(max = 1000) String bio,
    String avatarUrl,
    List<String> skills,
    String headline,
    List<String> portfolioLinks,
    Boolean openToWork,
    @Size(max = 255) String location,
    /** Saved resume for quick apply; "" removes it. */
    @Size(max = 500) String resumeUrl,
    @Size(max = 255) String resumeFileName,
    Boolean publicProfile
) {}
