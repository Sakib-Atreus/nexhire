package com.nexhire.api.modules.jobs;

import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import org.springframework.stereotype.Component;

/**
 * Who may manage a job (edit it, see applicants, run the pipeline): admins, the recruiter who
 * posted it, and any recruiter on the same company team.
 */
@Component
public class JobAccess {

    /** Placeholder for "no company" in team queries (never matches a real company id). */
    public static final java.util.UUID NO_COMPANY = new java.util.UUID(0L, 0L);

    public static java.util.UUID companyOrNone(User user) {
        return user.getCompanyId() != null ? user.getCompanyId() : NO_COMPANY;
    }

    public boolean canManage(Job job, User user) {
        if (user == null) return false;
        if (user.getRole() == Role.ADMIN) return true;
        if (job.getRecruiter().getId().equals(user.getId())) return true;
        return user.getRole() == Role.RECRUITER
            && user.getCompanyId() != null
            && job.getCompany() != null
            && user.getCompanyId().equals(job.getCompany().getId());
    }
}
