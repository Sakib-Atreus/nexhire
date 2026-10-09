package com.nexhire.api.alerts;

import com.nexhire.api.modules.alerts.JobAlert;
import com.nexhire.api.modules.alerts.JobAlertService;
import com.nexhire.api.modules.jobs.ExperienceLevel;
import com.nexhire.api.modules.jobs.Job;
import com.nexhire.api.modules.jobs.JobType;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class JobAlertMatchingTest {

    private static boolean matches(JobAlert alert, Job job) throws Exception {
        Method m = JobAlertService.class.getDeclaredMethod("matches", JobAlert.class, Job.class);
        m.setAccessible(true);
        return (boolean) m.invoke(null, alert, job);
    }

    private final Job job = Job.builder()
        .title("Senior React Engineer").description("Build our design system").tags("React,TypeScript")
        .companyName("Acme").location("Dhaka, Bangladesh").category("Software Engineering")
        .jobType(JobType.FULL_TIME).experienceLevel(ExperienceLevel.SENIOR).build();

    @Test
    void everySetCriterionMustMatch() throws Exception {
        assertThat(matches(JobAlert.builder().keyword("react").location("dhaka").build(), job)).isTrue();
        assertThat(matches(JobAlert.builder().keyword("typescript").category("software engineering").build(), job)).isTrue();
        assertThat(matches(JobAlert.builder().keyword("react").location("berlin").build(), job)).isFalse();
        assertThat(matches(JobAlert.builder().jobType(JobType.CONTRACT).build(), job)).isFalse();
        assertThat(matches(JobAlert.builder().experienceLevel(ExperienceLevel.SENIOR).build(), job)).isTrue();
        assertThat(matches(JobAlert.builder().keyword("golang").build(), job)).isFalse();
    }
}
