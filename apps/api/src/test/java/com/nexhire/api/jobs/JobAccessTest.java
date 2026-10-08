package com.nexhire.api.jobs;

import com.nexhire.api.modules.companies.Company;
import com.nexhire.api.modules.jobs.Job;
import com.nexhire.api.modules.jobs.JobAccess;
import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JobAccessTest {

    private final JobAccess access = new JobAccess();
    private final Company acme = Company.builder().id(UUID.randomUUID()).name("Acme").slug("acme").build();

    private User user(Role role, UUID companyId) {
        return User.builder().id(UUID.randomUUID()).role(role).companyId(companyId).email("x@test.com").firstName("A").lastName("B").build();
    }

    private Job job(User poster, Company company) {
        return Job.builder().id(UUID.randomUUID()).recruiter(poster).company(company).title("T").companyName("Acme").build();
    }

    @Test
    void posterAdminAndTeammatesCanManage_othersCannot() {
        User poster = user(Role.RECRUITER, acme.getId());
        Job job = job(poster, acme);

        assertThat(access.canManage(job, poster)).isTrue();
        assertThat(access.canManage(job, user(Role.ADMIN, null))).isTrue();
        assertThat(access.canManage(job, user(Role.RECRUITER, acme.getId()))).isTrue();
        assertThat(access.canManage(job, user(Role.RECRUITER, UUID.randomUUID()))).isFalse();
        assertThat(access.canManage(job, user(Role.RECRUITER, null))).isFalse();
        assertThat(access.canManage(job, user(Role.CANDIDATE, acme.getId()))).isFalse();
        assertThat(access.canManage(job, null)).isFalse();
    }

    @Test
    void jobWithoutCompany_onlyPosterAndAdmin() {
        User poster = user(Role.RECRUITER, null);
        Job job = job(poster, null);

        assertThat(access.canManage(job, poster)).isTrue();
        assertThat(access.canManage(job, user(Role.RECRUITER, acme.getId()))).isFalse();
    }
}
