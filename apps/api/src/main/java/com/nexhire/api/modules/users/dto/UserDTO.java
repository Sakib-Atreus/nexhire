package com.nexhire.api.modules.users.dto;

import com.nexhire.api.modules.users.Role;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserDTO(
    UUID id,
    String email,
    String firstName,
    String lastName,
    String fullName,
    Role role,
    String phone,
    String bio,
    String avatarUrl,
    boolean emailVerified,
    Instant createdAt,
    List<String> skills,
    String headline,
    List<String> portfolioLinks,
    boolean enabled,
    boolean openToWork
) {}
