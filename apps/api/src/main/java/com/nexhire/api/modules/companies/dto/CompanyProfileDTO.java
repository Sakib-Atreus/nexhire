package com.nexhire.api.modules.companies.dto;

import com.nexhire.api.modules.jobs.dto.JobDTO;

import java.util.List;

/** Public company page: profile plus its open, visible jobs. */
public record CompanyProfileDTO(
    CompanyDTO company,
    List<JobDTO> openJobs
) {}
