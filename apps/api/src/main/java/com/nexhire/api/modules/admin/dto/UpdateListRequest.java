package com.nexhire.api.modules.admin.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UpdateListRequest(@NotNull List<String> items) {}
