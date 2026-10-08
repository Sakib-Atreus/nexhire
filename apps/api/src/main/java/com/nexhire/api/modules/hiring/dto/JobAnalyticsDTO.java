package com.nexhire.api.modules.hiring.dto;

import com.nexhire.api.modules.admin.dto.AdminOverviewDTO.DailyCount;

import java.util.List;
import java.util.Map;

/**
 * Funnel for one job: views → applications → interviewed → offered → hired.
 * Stage counts are "reached at least this stage" (e.g. hired applicants also count as offered).
 */
public record JobAnalyticsDTO(
    long views,
    long applications,
    long interviewed,
    long offered,
    long hired,
    int openings,
    Map<String, Long> byStatus,
    /** Applications ÷ views, as a percentage (null when there are no views). */
    Double viewToApplyRate,
    /** Hired ÷ applications, as a percentage (null when there are no applications). */
    Double applyToHireRate,
    Double averageRating,
    long daysOpen,
    /** Applications per day over the last 30 days (UTC, oldest first, no gaps). */
    List<DailyCount> applicationsPerDay
) {}
