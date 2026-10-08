package com.nexhire.api.modules.admin.dto;

import java.util.List;

/** Platform-wide numbers for the admin overview. Daily series cover the last 30 days, oldest first, with no gaps. */
public record AdminOverviewDTO(
    long totalUsers,
    long candidates,
    long recruiters,
    long admins,
    long suspendedUsers,
    long unverifiedRecruiters,
    long newUsersLast30Days,
    long totalJobs,
    long openJobs,
    long hiddenJobs,
    long featuredJobs,
    long totalApplications,
    long applicationsLast30Days,
    long openReports,
    List<DailyCount> signupsPerDay,
    List<DailyCount> applicationsPerDay,
    List<CompanyStat> topCompanies
) {
    public record DailyCount(String date, long count) {}

    public record CompanyStat(String companyName, long openJobs, long applications) {}
}
