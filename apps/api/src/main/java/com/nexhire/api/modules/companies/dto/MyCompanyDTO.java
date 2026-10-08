package com.nexhire.api.modules.companies.dto;

import java.util.List;

/** The signed-in recruiter's company, its team and whether they manage it. */
public record MyCompanyDTO(
    CompanyDTO company,
    List<CompanyMemberDTO> members,
    boolean isOwner
) {}
