package com.nexhire.api.applications;

import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.modules.applications.Application;
import com.nexhire.api.modules.applications.ApplicationRepository;
import com.nexhire.api.modules.applications.ApplicationService;
import com.nexhire.api.modules.applications.ApplicationStatus;
import com.nexhire.api.modules.applications.dto.ApplyJobRequest;
import com.nexhire.api.modules.jobs.Job;
import com.nexhire.api.modules.jobs.JobRepository;
import com.nexhire.api.modules.jobs.JobStatus;
import com.nexhire.api.modules.jobs.JobType;
import com.nexhire.api.modules.jobs.ExperienceLevel;
import com.nexhire.api.modules.notifications.NotificationService;
import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock private ApplicationRepository applicationRepository;
    @Mock private JobRepository jobRepository;
    @Mock private NotificationService notificationService;
    @InjectMocks private ApplicationService applicationService;

    private User candidate() {
        return User.builder().id(UUID.randomUUID()).role(Role.CANDIDATE)
            .firstName("Alice").lastName("Smith").email("a@test.com").build();
    }

    private Job openJob(User recruiter) {
        return Job.builder()
            .id(UUID.randomUUID())
            .title("Dev")
            .description("desc")
            .companyName("Corp")
            .jobType(JobType.FULL_TIME)
            .experienceLevel(ExperienceLevel.MID)
            .salaryCurrency("USD")
            .status(JobStatus.OPEN)
            .recruiter(recruiter)
            .build();
    }

    @Test
    void apply_toOpenJob_returnsApplicationDTO() {
        User candidate = candidate();
        User recruiter = User.builder().id(UUID.randomUUID()).role(Role.RECRUITER)
            .firstName("Bob").lastName("Jones").email("b@test.com").build();
        Job job = openJob(recruiter);
        ApplyJobRequest request = new ApplyJobRequest(job.getId(), "Cover letter", null);

        when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));
        when(applicationRepository.existsByJobIdAndCandidateId(job.getId(), candidate.getId())).thenReturn(false);

        Application savedApp = Application.builder()
            .id(UUID.randomUUID())
            .job(job)
            .candidate(candidate)
            .status(ApplicationStatus.PENDING)
            .build();
        when(applicationRepository.save(any())).thenReturn(savedApp);
        doNothing().when(notificationService).notifyApplicationReceived(savedApp);

        var result = applicationService.apply(request, candidate);

        assertThat(result.status()).isEqualTo(ApplicationStatus.PENDING);
        assertThat(result.jobId()).isEqualTo(job.getId());
    }

    @Test
    void apply_toClosedJob_throwsBadRequestException() {
        User candidate = candidate();
        User recruiter = User.builder().id(UUID.randomUUID()).role(Role.RECRUITER)
            .firstName("Bob").lastName("Jones").email("b@test.com").build();
        Job job = openJob(recruiter);
        job.setStatus(JobStatus.CLOSED);

        ApplyJobRequest request = new ApplyJobRequest(job.getId(), null, null);
        when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));

        assertThatThrownBy(() -> applicationService.apply(request, candidate))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("not accepting applications");
    }

    @Test
    void apply_twice_throwsBadRequestException() {
        User candidate = candidate();
        User recruiter = User.builder().id(UUID.randomUUID()).role(Role.RECRUITER)
            .firstName("Bob").lastName("Jones").email("b@test.com").build();
        Job job = openJob(recruiter);

        ApplyJobRequest request = new ApplyJobRequest(job.getId(), null, null);
        when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));
        when(applicationRepository.existsByJobIdAndCandidateId(job.getId(), candidate.getId())).thenReturn(true);

        assertThatThrownBy(() -> applicationService.apply(request, candidate))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("already applied");
    }
}
