package com.nexhire.api.jobs;

import com.nexhire.api.exception.ForbiddenException;
import com.nexhire.api.exception.ResourceNotFoundException;
import com.nexhire.api.modules.jobs.*;
import com.nexhire.api.modules.jobs.dto.CreateJobRequest;
import com.nexhire.api.modules.jobs.dto.UpdateJobRequest;
import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock private JobRepository jobRepository;
    @InjectMocks private JobService jobService;

    private User recruiter() {
        return User.builder().id(UUID.randomUUID()).role(Role.RECRUITER)
            .firstName("John").lastName("Doe").email("r@test.com").build();
    }

    @Test
    void create_withValidRequest_returnsJobDTO() {
        User recruiter = recruiter();
        CreateJobRequest request = new CreateJobRequest(
            "Backend Developer", "Description", null, null,
            "ACME Corp", null, "Remote", JobType.REMOTE,
            ExperienceLevel.MID, null, null, null, null, null
        );
        Job savedJob = Job.builder()
            .id(UUID.randomUUID())
            .title("Backend Developer")
            .companyName("ACME Corp")
            .recruiter(recruiter)
            .jobType(JobType.REMOTE)
            .experienceLevel(ExperienceLevel.MID)
            .status(JobStatus.DRAFT)
            .salaryCurrency("USD")
            .description("Description")
            .build();

        when(jobRepository.save(any(Job.class))).thenReturn(savedJob);

        var result = jobService.create(request, recruiter);

        assertThat(result.title()).isEqualTo("Backend Developer");
        assertThat(result.status()).isEqualTo(JobStatus.DRAFT);
    }

    @Test
    void getById_withNonExistentId_throwsResourceNotFoundException() {
        UUID id = UUID.randomUUID();
        when(jobRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> jobService.getById(id))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_byNonOwner_throwsForbiddenException() {
        User recruiter = recruiter();
        User otherUser = User.builder().id(UUID.randomUUID()).role(Role.RECRUITER)
            .firstName("Jane").lastName("Smith").email("j@test.com").build();

        Job job = Job.builder()
            .id(UUID.randomUUID())
            .title("Job")
            .recruiter(recruiter)
            .status(JobStatus.OPEN)
            .description("desc")
            .companyName("Corp")
            .jobType(JobType.FULL_TIME)
            .experienceLevel(ExperienceLevel.MID)
            .salaryCurrency("USD")
            .build();

        when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));

        assertThatThrownBy(() -> jobService.delete(job.getId(), otherUser))
            .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void search_returnsPageOfJobs() {
        when(jobRepository.search(any(), any(), any(), any(), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of()));

        var result = jobService.search(null, null, null, null, Pageable.unpaged());

        assertThat(result.getContent()).isEmpty();
    }
}
