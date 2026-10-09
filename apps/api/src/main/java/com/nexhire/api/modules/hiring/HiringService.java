package com.nexhire.api.modules.hiring;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexhire.api.modules.timeline.TimelineService;
import com.nexhire.api.modules.timeline.ApplicationEventDTO;
import com.nexhire.api.modules.timeline.ApplicationEventType;
import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.exception.ForbiddenException;
import com.nexhire.api.exception.ResourceNotFoundException;
import com.nexhire.api.modules.admin.dto.AdminOverviewDTO.DailyCount;
import com.nexhire.api.modules.applications.Application;
import com.nexhire.api.modules.applications.ApplicationRepository;
import com.nexhire.api.modules.applications.ApplicationService;
import com.nexhire.api.modules.applications.ApplicationStatus;
import com.nexhire.api.modules.hiring.dto.*;
import com.nexhire.api.modules.jobs.Job;
import com.nexhire.api.modules.jobs.JobAccess;
import com.nexhire.api.modules.jobs.JobRepository;
import com.nexhire.api.modules.notifications.NotificationService;
import com.nexhire.api.modules.notifications.NotificationType;
import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;

/** Recruiter hiring tools: private notes, candidate messages, interviews, templates and job analytics. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HiringService {

    private static final int MAX_TEMPLATES = 50;
    private static final int SERIES_DAYS = 30;
    private static final int MAX_INTERVIEW_MINUTES = 480;
    private static final long FOLLOW_UP_AFTER_HOURS = 48;
    private static final Set<ApplicationStatus> BEFORE_INTERVIEW =
        EnumSet.of(ApplicationStatus.PENDING, ApplicationStatus.REVIEWING, ApplicationStatus.SHORTLISTED);

    private final ApplicationService applicationService;
    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final JobAccess jobAccess;
    private final ApplicationNoteRepository noteRepository;
    private final ApplicationMessageRepository messageRepository;
    private final InterviewRepository interviewRepository;
    private final MessageTemplateRepository templateRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final TimelineService timelineService;

    // ─── Private notes ──────────────────────────────────────────────────────

    public List<NoteDTO> notes(UUID applicationId, User user) {
        applicationService.getManaged(applicationId, user);
        return noteRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId).stream().map(this::toDTO).toList();
    }

    @Transactional
    public NoteDTO addNote(UUID applicationId, String body, User user) {
        applicationService.getManaged(applicationId, user);
        return toDTO(noteRepository.save(ApplicationNote.builder()
            .applicationId(applicationId)
            .authorId(user.getId())
            .authorName(user.getFullName())
            .body(body.trim())
            .build()));
    }

    @Transactional
    public void deleteNote(UUID noteId, User user) {
        ApplicationNote note = noteRepository.findById(noteId)
            .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));
        if (!user.getId().equals(note.getAuthorId()) && user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You can only delete your own notes");
        }
        noteRepository.delete(note);
    }

    // ─── Timeline ───────────────────────────────────────────────────────────

    public List<ApplicationEventDTO> timeline(UUID applicationId, User user) {
        Application app = applicationService.getParticipating(applicationId, user);
        boolean candidateView = app.getCandidate().getId().equals(user.getId());
        return timelineService.events(applicationId, candidateView);
    }

    // ─── Messages ───────────────────────────────────────────────────────────

    public List<MessageDTO> messages(UUID applicationId, User user) {
        applicationService.getParticipating(applicationId, user);
        return messageRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId).stream().map(this::toDTO).toList();
    }

    /** Send a message on an application. From the hiring team, {{placeholders}} are filled in. */
    @Transactional
    public MessageDTO sendMessage(UUID applicationId, String rawBody, User user) {
        Application app = applicationService.getParticipating(applicationId, user);
        boolean fromCandidate = app.getCandidate().getId().equals(user.getId());
        Job job = app.getJob();
        String body = fromCandidate ? rawBody.trim() : fillPlaceholders(rawBody.trim(), app, user);

        ApplicationMessage saved = messageRepository.save(ApplicationMessage.builder()
            .applicationId(applicationId)
            .senderId(user.getId())
            .senderName(fromCandidate ? user.getFullName() : user.getFullName() + " · " + job.getCompanyName())
            .fromCandidate(fromCandidate)
            .body(body)
            .build());

        UUID recipient = fromCandidate ? job.getRecruiter().getId() : app.getCandidate().getId();
        String title = fromCandidate ? "New message from " + app.getCandidate().getFullName() : "New message from " + job.getCompanyName();
        notificationService.notify(recipient, NotificationType.MESSAGE_RECEIVED, title,
            "About '" + job.getTitle() + "': " + preview(body), applicationId, "APPLICATION");
        return toDTO(saved);
    }

    // ─── Interviews ─────────────────────────────────────────────────────────

    public List<InterviewDTO> interviews(UUID applicationId, User user) {
        applicationService.getParticipating(applicationId, user);
        return interviewRepository.findByApplicationIdOrderByScheduledAtAsc(applicationId).stream().map(this::toDTO).toList();
    }

    @Transactional
    public InterviewDTO schedule(UUID applicationId, InterviewRequest request, User user) {
        Application app = applicationService.getManaged(applicationId, user);
        if (app.getStatus() == ApplicationStatus.WITHDRAWN || app.getStatus() == ApplicationStatus.REJECTED) {
            throw new BadRequestException("You can't schedule an interview for a closed application");
        }
        if (request.scheduledAt() == null) throw new BadRequestException("Choose a date and time");
        if (request.type() == null) throw new BadRequestException("Choose the interview type");
        if (request.scheduledAt().isBefore(Instant.now())) throw new BadRequestException("Choose a time in the future");
        int duration = request.durationMinutes() != null ? request.durationMinutes() : 45;
        if (!Boolean.TRUE.equals(request.allowConflicts())) {
            List<InterviewConflictDTO> clashes = findConflicts(app, request.scheduledAt(), duration, null, user);
            if (!clashes.isEmpty()) throw new InterviewConflictException(clashes);
        }

        Interview saved = interviewRepository.save(Interview.builder()
            .application(app)
            .scheduledAt(request.scheduledAt())
            .durationMinutes(duration)
            .type(request.type())
            .location(blank(request.location()))
            .message(blank(request.message()))
            .createdBy(user.getId())
            .build());

        timelineService.record(app.getId(), ApplicationEventType.INTERVIEW_SCHEDULED,
            null, null, typeLabel(saved.getType()) + " interview · " + saved.getDurationMinutes() + " min", user);
        // Scheduling an interview moves the applicant to the Interview stage.
        if (BEFORE_INTERVIEW.contains(app.getStatus())) {
            timelineService.record(app.getId(), ApplicationEventType.STATUS_CHANGED,
                app.getStatus(), ApplicationStatus.INTERVIEWED, null, user);
            app.setStatus(ApplicationStatus.INTERVIEWED);
            applicationRepository.save(app);
        }
        notificationService.notify(app.getCandidate().getId(), NotificationType.INTERVIEW_SCHEDULED,
            "Interview scheduled",
            app.getJob().getCompanyName() + " scheduled a " + typeLabel(saved.getType()) + " interview for '"
                + app.getJob().getTitle() + "'. Open your application for the time and details.",
            app.getId(), "APPLICATION");
        return toDTO(saved);
    }

    @Transactional
    public InterviewDTO updateInterview(UUID interviewId, InterviewRequest request, User user) {
        Interview interview = interviewRepository.findById(interviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Interview", "id", interviewId));
        Application app = applicationService.getManaged(interview.getApplication().getId(), user);

        boolean rescheduled = request.scheduledAt() != null && !request.scheduledAt().equals(interview.getScheduledAt());
        if (rescheduled && request.scheduledAt().isBefore(Instant.now())) throw new BadRequestException("Choose a time in the future");
        boolean cancelled = request.status() == InterviewStatus.CANCELLED && interview.getStatus() != InterviewStatus.CANCELLED;
        boolean timeChanged = rescheduled
            || (request.durationMinutes() != null && request.durationMinutes() != interview.getDurationMinutes());
        InterviewStatus nextStatus = request.status() != null ? request.status() : interview.getStatus();
        if (timeChanged && nextStatus == InterviewStatus.SCHEDULED && !Boolean.TRUE.equals(request.allowConflicts())) {
            Instant start = request.scheduledAt() != null ? request.scheduledAt() : interview.getScheduledAt();
            int duration = request.durationMinutes() != null ? request.durationMinutes() : interview.getDurationMinutes();
            List<InterviewConflictDTO> clashes = findConflicts(app, start, duration, interview.getId(), user);
            if (!clashes.isEmpty()) throw new InterviewConflictException(clashes);
        }

        // A new time goes back to the candidate for confirmation, unless it's one they suggested themselves.
        boolean pickedCandidateTime = rescheduled && proposedTimes(interview).contains(request.scheduledAt());
        if (rescheduled) {
            interview.setInvitedAt(Instant.now());
            interview.setProposedTimes(null);
            if (pickedCandidateTime) {
                interview.setResponse(InterviewResponse.ACCEPTED);
                interview.setRespondedAt(Instant.now());
            } else {
                interview.setResponse(InterviewResponse.AWAITING);
                interview.setResponseNote(null);
                interview.setRespondedAt(null);
            }
        }
        if (request.scheduledAt() != null) interview.setScheduledAt(request.scheduledAt());
        if (request.durationMinutes() != null) interview.setDurationMinutes(request.durationMinutes());
        if (request.type() != null) interview.setType(request.type());
        if (request.location() != null) interview.setLocation(blank(request.location()));
        if (request.message() != null) interview.setMessage(blank(request.message()));
        if (request.status() != null) interview.setStatus(request.status());
        boolean completed = request.status() == InterviewStatus.COMPLETED;
        Interview saved = interviewRepository.save(interview);
        if (cancelled) {
            timelineService.record(app.getId(), ApplicationEventType.INTERVIEW_CANCELLED, null, null, null, user);
        } else if (completed) {
            timelineService.record(app.getId(), ApplicationEventType.INTERVIEW_COMPLETED, null, null, null, user);
        } else if (rescheduled) {
            timelineService.record(app.getId(), ApplicationEventType.INTERVIEW_RESCHEDULED, null, null,
                pickedCandidateTime ? "Confirmed one of the candidate's suggested times" : null, user);
        }

        if (cancelled || (rescheduled && saved.getStatus() == InterviewStatus.SCHEDULED)) {
            String title = cancelled ? "Interview cancelled" : pickedCandidateTime ? "Interview time confirmed" : "Interview rescheduled";
            String body = cancelled
                ? app.getJob().getCompanyName() + " cancelled your interview for '" + app.getJob().getTitle() + "'."
                : pickedCandidateTime
                    ? app.getJob().getCompanyName() + " confirmed one of your suggested times for '" + app.getJob().getTitle() + "'."
                    : app.getJob().getCompanyName() + " proposed a new time for your interview for '" + app.getJob().getTitle()
                        + "'. Please confirm it or suggest another time.";
            notificationService.notify(app.getCandidate().getId(), NotificationType.INTERVIEW_UPDATED, title, body,
                app.getId(), "APPLICATION");
        }
        return toDTO(saved);
    }

    /** Clashes for a proposed time, so the scheduling form can warn before saving (hiring team only). */
    public List<InterviewConflictDTO> conflicts(UUID applicationId, Instant start, int durationMinutes, UUID excludeInterviewId, User user) {
        Application app = applicationService.getManaged(applicationId, user);
        if (start == null) throw new BadRequestException("Choose a date and time");
        if (durationMinutes < 5 || durationMinutes > 480) throw new BadRequestException("Duration must be between 5 and 480 minutes");
        return findConflicts(app, start, durationMinutes, excludeInterviewId, user);
    }

    /**
     * The scheduling recruiter's own interviews overlapping [start, start + duration).
     * Overlap means existing.start < new.end and new.start < existing.end (back-to-back is fine).
     * The candidate's other commitments are deliberately NOT checked here (privacy): the candidate
     * sees their own clashes when they respond, and can ask for another time.
     */
    private List<InterviewConflictDTO> findConflicts(Application app, Instant start, int durationMinutes, UUID excludeId, User user) {
        Instant end = start.plus(durationMinutes, ChronoUnit.MINUTES);
        // Interviews last at most 480 minutes, so anything overlapping must start after (start - 480 min).
        Instant windowFrom = start.minus(MAX_INTERVIEW_MINUTES, ChronoUnit.MINUTES);

        Map<UUID, InterviewConflictDTO> found = new LinkedHashMap<>();
        for (Interview i : interviewRepository.scheduledByCreatorBetween(user.getId(), windowFrom, end)) {
            if (overlaps(i, start, end, excludeId)) found.put(i.getId(), conflict("YOU", i, user));
        }
        return found.values().stream()
            .sorted(Comparator.comparing(InterviewConflictDTO::scheduledAt))
            .toList();
    }

    private static boolean overlaps(Interview i, Instant start, Instant end, UUID excludeId) {
        if (i.getId().equals(excludeId)) return false;
        Instant iEnd = i.getScheduledAt().plus(i.getDurationMinutes(), ChronoUnit.MINUTES);
        return i.getScheduledAt().isBefore(end) && start.isBefore(iEnd);
    }

    /** Hide another company's interview details from this recruiter. */
    private InterviewConflictDTO conflict(String who, Interview i, User user) {
        Application a = i.getApplication();
        boolean visible = jobAccess.canManage(a.getJob(), user);
        String label = visible
            ? a.getCandidate().getFullName() + " · " + a.getJob().getTitle()
            : "Another interview";
        return new InterviewConflictDTO(who, visible ? i.getId() : null, visible ? a.getId() : null,
            i.getScheduledAt(), i.getDurationMinutes(), label);
    }

    /** The candidate accepts, declines, or asks for another time (1–3 suggestions). */
    @Transactional
    public InterviewDTO respond(UUID interviewId, RespondToInterviewRequest request, User user) {
        Interview interview = interviewRepository.findById(interviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Interview", "id", interviewId));
        Application app = interview.getApplication();
        if (!app.getCandidate().getId().equals(user.getId())) {
            throw new ForbiddenException("Only the candidate can respond to this interview");
        }
        if (interview.getStatus() != InterviewStatus.SCHEDULED) throw new BadRequestException("This interview is no longer scheduled");
        if (interview.getScheduledAt().isBefore(Instant.now())) throw new BadRequestException("This interview has already started");
        if (request.response() == InterviewResponse.AWAITING) throw new BadRequestException("Choose accept, decline or another time");

        List<Instant> proposed = List.of();
        if (request.response() == InterviewResponse.NEW_TIME_REQUESTED) {
            proposed = request.proposedTimes() == null ? List.of()
                : request.proposedTimes().stream().filter(Objects::nonNull).distinct().sorted().toList();
            if (proposed.isEmpty()) throw new BadRequestException("Suggest at least one time that works for you");
            if (proposed.stream().anyMatch(t -> t.isBefore(Instant.now()))) throw new BadRequestException("Suggested times must be in the future");
        }

        interview.setResponse(request.response());
        interview.setResponseNote(blank(request.note()));
        interview.setProposedTimes(proposed.isEmpty() ? null : toJson(proposed));
        interview.setRespondedAt(Instant.now());
        Interview saved = interviewRepository.save(interview);
        timelineService.record(app.getId(), switch (request.response()) {
            case ACCEPTED -> ApplicationEventType.INTERVIEW_ACCEPTED;
            case DECLINED -> ApplicationEventType.INTERVIEW_DECLINED;
            default -> ApplicationEventType.INTERVIEW_NEW_TIME_REQUESTED;
        }, null, null, saved.getResponseNote(), user);

        String who = app.getCandidate().getFullName();
        String what = switch (request.response()) {
            case ACCEPTED -> who + " accepted the interview";
            case DECLINED -> who + " declined the interview";
            case NEW_TIME_REQUESTED -> who + " asked for another interview time";
            default -> who + " responded to the interview";
        };
        UUID recipient = interview.getCreatedBy() != null ? interview.getCreatedBy() : app.getJob().getRecruiter().getId();
        notificationService.notify(recipient, NotificationType.INTERVIEW_RESPONSE, what,
            "'" + app.getJob().getTitle() + "'" + (saved.getResponseNote() != null ? ": " + preview(saved.getResponseNote()) : "."),
            app.getId(), "APPLICATION");
        return toDTO(saved);
    }

    private List<Instant> proposedTimes(Interview i) {
        if (i.getProposedTimes() == null || i.getProposedTimes().isBlank()) return List.of();
        try {
            return objectMapper.readValue(i.getProposedTimes(), new TypeReference<List<Instant>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private String toJson(List<Instant> times) {
        try {
            return objectMapper.writeValueAsString(times.stream().map(Instant::toString).toList());
        } catch (Exception e) {
            throw new IllegalStateException("Could not store proposed times", e);
        }
    }

    /** Upcoming scheduled interviews: a candidate's own, or every interview on jobs a recruiter manages. */
    public List<InterviewDTO> upcoming(User user) {
        Instant from = Instant.now().minus(1, ChronoUnit.HOURS);
        List<Interview> list = switch (user.getRole()) {
            case CANDIDATE -> interviewRepository.upcomingForCandidate(user.getId(), from);
            case RECRUITER -> interviewRepository.upcomingForRecruiter(user.getId(), JobAccess.companyOrNone(user), from);
            default -> List.of();
        };
        return list.stream().limit(50).map(this::toDTO).toList();
    }

    // ─── Templates ──────────────────────────────────────────────────────────

    public List<TemplateDTO> templates(User user) {
        return templateRepository.findByOwnerIdOrderByNameAsc(user.getId()).stream().map(this::toDTO).toList();
    }

    @Transactional
    public TemplateDTO createTemplate(TemplateRequest request, User user) {
        if (templateRepository.countByOwnerId(user.getId()) >= MAX_TEMPLATES) {
            throw new BadRequestException("You can keep up to " + MAX_TEMPLATES + " templates");
        }
        return toDTO(templateRepository.save(MessageTemplate.builder()
            .ownerId(user.getId()).name(request.name().trim()).body(request.body().trim()).build()));
    }

    @Transactional
    public TemplateDTO updateTemplate(UUID id, TemplateRequest request, User user) {
        MessageTemplate t = ownTemplate(id, user);
        t.setName(request.name().trim());
        t.setBody(request.body().trim());
        return toDTO(templateRepository.save(t));
    }

    @Transactional
    public void deleteTemplate(UUID id, User user) {
        templateRepository.delete(ownTemplate(id, user));
    }

    // ─── Analytics ──────────────────────────────────────────────────────────

    public JobAnalyticsDTO analytics(UUID jobId, User user) {
        Job job = jobRepository.findById(jobId)
            .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));
        if (!jobAccess.canManage(job, user)) throw new ForbiddenException("Only the hiring team can see this job's analytics");

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (ApplicationStatus s : ApplicationStatus.values()) {
            byStatus.put(s.name(), applicationRepository.countByJobIdAndStatus(jobId, s));
        }
        long applications = byStatus.values().stream().mapToLong(Long::longValue).sum();
        long hired = byStatus.get("HIRED");
        long offered = hired + byStatus.get("OFFERED");
        // Interviewed = reached the Interview stage or had an interview booked.
        long interviewed = Math.max(offered + byStatus.get("INTERVIEWED"), interviewRepository.countInterviewedApplications(jobId));

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate firstDay = today.minusDays(SERIES_DAYS - 1L);
        Map<String, Long> perDay = new HashMap<>();
        for (Object[] r : applicationRepository.countPerDayForJob(jobId, firstDay.atStartOfDay(ZoneOffset.UTC).toInstant())) {
            perDay.put((String) r[0], ((Number) r[1]).longValue());
        }
        List<DailyCount> series = new ArrayList<>();
        for (int i = 0; i < SERIES_DAYS; i++) {
            String day = firstDay.plusDays(i).toString();
            series.add(new DailyCount(day, perDay.getOrDefault(day, 0L)));
        }

        long views = job.getViewCount();
        Double avg = applicationRepository.averageRating(jobId);
        return new JobAnalyticsDTO(
            views, applications, interviewed, offered, hired, job.getOpenings(), byStatus,
            // Capped: applications can outnumber counted views (team views are excluded, API applies).
            views > 0 ? round(Math.min(100.0, 100.0 * applications / views)) : null,
            applications > 0 ? round(100.0 * hired / applications) : null,
            avg != null ? round(avg) : null,
            Math.max(0, ChronoUnit.DAYS.between(job.getCreatedAt(), Instant.now())),
            series);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private MessageTemplate ownTemplate(UUID id, User user) {
        return templateRepository.findById(id)
            .filter(t -> t.getOwnerId().equals(user.getId()))
            .orElseThrow(() -> new ResourceNotFoundException("Template", "id", id));
    }

    private static String fillPlaceholders(String body, Application app, User sender) {
        return body
            .replace("{{candidateName}}", app.getCandidate().getFullName())
            .replace("{{firstName}}", app.getCandidate().getFirstName())
            .replace("{{jobTitle}}", app.getJob().getTitle())
            .replace("{{companyName}}", app.getJob().getCompanyName())
            .replace("{{recruiterName}}", sender.getFullName());
    }

    private static String preview(String body) {
        String oneLine = body.replaceAll("\\s+", " ");
        return oneLine.length() > 140 ? oneLine.substring(0, 137) + "…" : oneLine;
    }

    private static String typeLabel(InterviewType type) {
        return switch (type) {
            case VIDEO -> "video";
            case PHONE -> "phone";
            case ONSITE -> "on-site";
        };
    }

    private static String blank(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private NoteDTO toDTO(ApplicationNote n) {
        return new NoteDTO(n.getId(), n.getApplicationId(), n.getAuthorId(), n.getAuthorName(), n.getBody(), n.getCreatedAt());
    }

    private MessageDTO toDTO(ApplicationMessage m) {
        return new MessageDTO(m.getId(), m.getApplicationId(), m.getSenderId(), m.getSenderName(), m.isFromCandidate(),
            m.getBody(), m.getCreatedAt());
    }

    private TemplateDTO toDTO(MessageTemplate t) {
        return new TemplateDTO(t.getId(), t.getName(), t.getBody(), t.getUpdatedAt());
    }

    private InterviewDTO toDTO(Interview i) {
        Application a = i.getApplication();
        Job j = a.getJob();
        Instant now = Instant.now();
        boolean needsFollowUp = i.getStatus() == InterviewStatus.SCHEDULED
            && i.getResponse() == InterviewResponse.AWAITING
            && i.getScheduledAt().isAfter(now)
            && i.getInvitedAt() != null
            && i.getInvitedAt().isBefore(now.minus(FOLLOW_UP_AFTER_HOURS, ChronoUnit.HOURS));
        return new InterviewDTO(i.getId(), a.getId(), j.getId(), j.getTitle(), j.getCompanyName(),
            a.getCandidate().getId(), a.getCandidate().getFullName(), i.getScheduledAt(), i.getDurationMinutes(),
            i.getType(), i.getLocation(), i.getMessage(), i.getStatus(), i.getCreatedAt(),
            i.getResponse(), i.getResponseNote(), proposedTimes(i), i.getRespondedAt(), i.getInvitedAt(), needsFollowUp);
    }
}
