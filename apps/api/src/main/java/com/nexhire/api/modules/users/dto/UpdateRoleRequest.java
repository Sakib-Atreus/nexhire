package com.nexhire.api.modules.users.dto;

import com.nexhire.api.modules.users.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(@NotNull Role role) {}
