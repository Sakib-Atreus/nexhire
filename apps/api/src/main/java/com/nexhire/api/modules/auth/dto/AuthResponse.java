package com.nexhire.api.modules.auth.dto;

import com.nexhire.api.modules.users.dto.UserDTO;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    long expiresIn,
    UserDTO user
) {
    public AuthResponse(String accessToken, String refreshToken, long expiresIn, UserDTO user) {
        this(accessToken, refreshToken, "Bearer", expiresIn, user);
    }
}
