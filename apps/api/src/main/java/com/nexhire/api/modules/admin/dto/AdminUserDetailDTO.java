package com.nexhire.api.modules.admin.dto;

import com.nexhire.api.modules.applications.dto.ApplicationDTO;
import com.nexhire.api.modules.jobs.dto.JobDTO;
import com.nexhire.api.modules.users.dto.UserDTO;

import java.util.List;

/** A user plus their activity, for the admin user detail page. */
public record AdminUserDetailDTO(
    UserDTO user,
    long jobsPosted,
    long applicationsSubmitted,
    long reportsFiled,
    List<JobDTO> recentJobs,
    List<ApplicationDTO> recentApplications,
    List<AuditLogDTO> history
) {}
