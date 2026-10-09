package com.nexhire.api.hiring;

import com.nexhire.api.modules.applications.Application;
import com.nexhire.api.modules.applications.ApplicationRepository;
import com.nexhire.api.modules.applications.ApplicationService;
import com.nexhire.api.modules.applications.ApplicationStatus;
import com.nexhire.api.modules.companies.Company;
import com.nexhire.api.modules.hiring.*;
import com.nexhire.api.modules.hiring.dto.InterviewConflictDTO;
import com.nexhire.api.modules.hiring.dto.InterviewRequest;
import com.nexhire.api.modules.hiring.dto.RespondToInterviewRequest;
import com.nexhire.api.modules.jobs.Job;
import com.nexhire.api.modules.jobs.JobAccess;
import com.nexhire.api.modules.jobs.JobRepository;
import com.nexhire.api.modules.notifications.NotificationService;
import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewConflictTest {

    @Mock private ApplicationService applicationService;
    @Mock private ApplicationRepository applicationRepository;
    @Mock private JobRepository jobRepository;
    @Spy private JobAccess jobAccess = new JobAccess();
    @Mock private ApplicationNoteRepository noteRepository;
    @Mock private ApplicationMessageRepository messageRepository;
    @Mock private InterviewRepository interviewRepository;
    @Mock private MessageTemplateRepository templateRepository;
    @Mock private NotificationService notificationService;
    @Mock private com.nexhire.api.modules.timeline.TimelineService timelineService;
    @Spy private com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper().findAndRegisterModules();
    @InjectMocks private HiringService hiringService;

    private final Company acme = Company.builder().id(UUID.randomUUID()).name("Acme").slug("acme").build();
    private User recruiter;
    private Application app;
    private final Instant tenAm = Instant.now().plus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);

    @BeforeEach
    void setUp() {
        recruiter = user(Role.RECRUITER, acme.getId(), "Rex");
        app = application(recruiter, acme, user(Role.CANDIDATE, null, "Cara"));
        lenient().when(applicationService.getManaged(app.getId(), recruiter)).thenReturn(app);
        lenient().when(interviewRepository.save(any())).thenAnswer(inv -> {
            Interview i = inv.getArgument(0);
            if (i.getId() == null) i.setId(UUID.randomUUID());
            return i;
        });
    }

    private User user(Role role, UUID companyId, String name) {
        return User.builder().id(UUID.randomUUID()).role(role).companyId(companyId)
            .email(name.toLowerCase() + "@test.com").firstName(name).lastName("Test").build();
    }

    private Application application(User poster, Company company, User candidate) {
        Job job = Job.builder().id(UUID.randomUUID()).recruiter(poster).company(company).title("Engineer").companyName(company.getName()).build();
        return Application.builder().id(UUID.randomUUID()).job(job).candidate(candidate).status(ApplicationStatus.SHORTLISTED).build();
    }

    private Interview existing(Application a, Instant at, int minutes) {
        return Interview.builder().id(UUID.randomUUID()).application(a).scheduledAt(at).durationMinutes(minutes)
            .type(InterviewType.VIDEO).status(InterviewStatus.SCHEDULED).createdBy(recruiter.getId()).build();
    }

    private InterviewRequest at(Instant when, int minutes, Boolean allow) {
        return new InterviewRequest(when, minutes, InterviewType.VIDEO, null, null, null, allow);
    }

    @Test
    void overlappingRecruiterInterview_isRejectedWithDetails() {
        Application other = application(recruiter, acme, user(Role.CANDIDATE, null, "Dev"));
        when(interviewRepository.scheduledByCreatorBetween(eq(recruiter.getId()), any(), any()))
            .thenReturn(List.of(existing(other, tenAm.plus(30, ChronoUnit.MINUTES), 45)));

        assertThatThrownBy(() -> hiringService.schedule(app.getId(), at(tenAm, 45, null), recruiter))
            .isInstanceOfSatisfying(InterviewConflictException.class, ex -> {
                assertThat(ex.getConflicts()).hasSize(1);
                InterviewConflictDTO c = ex.getConflicts().get(0);
                assertThat(c.who()).isEqualTo("YOU");
                assertThat(c.label()).contains("Dev Test");
            });
        verify(interviewRepository, never()).save(any());
    }

    @Test
    void backToBack_isNotAClash() {
        Application other = application(recruiter, acme, user(Role.CANDIDATE, null, "Dev"));
        when(interviewRepository.scheduledByCreatorBetween(eq(recruiter.getId()), any(), any()))
            .thenReturn(List.of(existing(other, tenAm.minus(45, ChronoUnit.MINUTES), 45)));

        hiringService.schedule(app.getId(), at(tenAm, 45, null), recruiter);

        verify(interviewRepository).save(any());
    }

    @Test
    void allowConflicts_savesAnyway() {
        Application other = application(recruiter, acme, user(Role.CANDIDATE, null, "Dev"));
        lenient().when(interviewRepository.scheduledByCreatorBetween(eq(recruiter.getId()), any(), any()))
            .thenReturn(List.of(existing(other, tenAm, 60)));

        hiringService.schedule(app.getId(), at(tenAm, 45, true), recruiter);

        verify(interviewRepository).save(any());
    }

    @Test
    void candidatesOtherCommitments_areNeverShownToTheRecruiter() {
        // Only the recruiter's own calendar is queried; the candidate's schedule stays private.
        when(interviewRepository.scheduledByCreatorBetween(eq(recruiter.getId()), any(), any())).thenReturn(List.of());

        assertThat(hiringService.conflicts(app.getId(), tenAm, 45, null, recruiter)).isEmpty();
    }

    @Test
    void candidateCanAskForAnotherTime_andRecruiterIsNotified() {
        Interview invite = existing(app, tenAm, 45);
        when(interviewRepository.findById(invite.getId())).thenReturn(java.util.Optional.of(invite));
        Instant suggestion = tenAm.plus(1, ChronoUnit.DAYS);

        var dto = hiringService.respond(invite.getId(),
            new RespondToInterviewRequest(InterviewResponse.NEW_TIME_REQUESTED, "I have an exam that morning", List.of(suggestion)),
            app.getCandidate());

        assertThat(dto.response()).isEqualTo(InterviewResponse.NEW_TIME_REQUESTED);
        assertThat(dto.proposedTimes()).containsExactly(suggestion);
        verify(notificationService).notify(eq(recruiter.getId()), eq(com.nexhire.api.modules.notifications.NotificationType.INTERVIEW_RESPONSE), any(), any(), eq(app.getId()), any());
    }

    @Test
    void askingForAnotherTime_requiresASuggestion() {
        Interview invite = existing(app, tenAm, 45);
        when(interviewRepository.findById(invite.getId())).thenReturn(java.util.Optional.of(invite));

        assertThatThrownBy(() -> hiringService.respond(invite.getId(),
            new RespondToInterviewRequest(InterviewResponse.NEW_TIME_REQUESTED, null, List.of()), app.getCandidate()))
            .isInstanceOf(com.nexhire.api.exception.BadRequestException.class);
    }

    @Test
    void onlyTheCandidateCanRespond() {
        Interview invite = existing(app, tenAm, 45);
        when(interviewRepository.findById(invite.getId())).thenReturn(java.util.Optional.of(invite));

        assertThatThrownBy(() -> hiringService.respond(invite.getId(),
            new RespondToInterviewRequest(InterviewResponse.ACCEPTED, null, null), recruiter))
            .isInstanceOf(com.nexhire.api.exception.ForbiddenException.class);
    }

    @Test
    void pickingTheCandidatesSuggestedTime_confirmsIt_otherTimesNeedReconfirmation() throws Exception {
        Instant suggestion = tenAm.plus(1, ChronoUnit.DAYS);
        Interview invite = existing(app, tenAm, 45);
        invite.setResponse(InterviewResponse.NEW_TIME_REQUESTED);
        invite.setProposedTimes(objectMapper.writeValueAsString(List.of(suggestion.toString())));
        when(interviewRepository.findById(invite.getId())).thenReturn(java.util.Optional.of(invite));
        when(interviewRepository.scheduledByCreatorBetween(eq(recruiter.getId()), any(), any())).thenReturn(List.of());

        hiringService.updateInterview(invite.getId(), at(suggestion, 45, null), recruiter);
        assertThat(invite.getResponse()).isEqualTo(InterviewResponse.ACCEPTED);

        hiringService.updateInterview(invite.getId(), at(suggestion.plus(2, ChronoUnit.HOURS), 45, null), recruiter);
        assertThat(invite.getResponse()).isEqualTo(InterviewResponse.AWAITING);
        assertThat(invite.getProposedTimes()).isNull();
    }

    @Test
    void rescheduling_ignoresTheInterviewItself() {
        Interview mine = existing(app, tenAm, 45);
        when(interviewRepository.findById(mine.getId())).thenReturn(java.util.Optional.of(mine));
        when(interviewRepository.scheduledByCreatorBetween(eq(recruiter.getId()), any(), any())).thenReturn(List.of(mine));

        hiringService.updateInterview(mine.getId(), at(tenAm.plus(15, ChronoUnit.MINUTES), 45, null), recruiter);

        assertThat(mine.getScheduledAt()).isEqualTo(tenAm.plus(15, ChronoUnit.MINUTES));
    }
}
