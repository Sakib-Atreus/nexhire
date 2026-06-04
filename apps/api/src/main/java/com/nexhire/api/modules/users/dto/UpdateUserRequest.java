package com.nexhire.api.modules.users.dto;

import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
    @Size(max = 100) String firstName,
    @Size(max = 100) String lastName,
    @Size(max = 20) String phone,
    @Size(max = 1000) String bio,
    String avatarUrl
) {}
