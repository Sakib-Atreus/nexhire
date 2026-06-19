package com.nexhire.api.modules.applications.dto;

public record ApplicationStatsDTO(
    long pending,
    long reviewing,
    long shortlisted,
    long interviewed,
    long offered,
    long rejected,
    long withdrawn,
    long total
) {}
