package com.nexhire.api.modules.hiring;

import com.nexhire.api.modules.timeline.ApplicationEventDTO;
import com.nexhire.api.modules.applications.ApplicationService;
import com.nexhire.api.modules.applications.dto.ApplicationDTO;
import com.nexhire.api.modules.hiring.dto.*;
import com.nexhire.api.modules.users.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Hiring", description = "Pipeline tools: notes, ratings, messages, interviews, templates, analytics")
public class HiringController {

    private final HiringService hiringService;
    private final ApplicationService applicationService;

    // Notes & rating (hiring team only)

    @GetMapping("/applications/{id}/notes")
    @Operation(summary = "Private notes on an applicant")
    public ResponseEntity<List<NoteDTO>> notes(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(hiringService.notes(id, user));
    }

    @PostMapping("/applications/{id}/notes")
    @Operation(summary = "Add a private note")
    public ResponseEntity<NoteDTO> addNote(@PathVariable UUID id, @Valid @RequestBody TextRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hiringService.addNote(id, request.body(), user));
    }

    @DeleteMapping("/applications/notes/{noteId}")
    @Operation(summary = "Delete your own note")
    public ResponseEntity<Void> deleteNote(@PathVariable UUID noteId, @AuthenticationPrincipal User user) {
        hiringService.deleteNote(noteId, user);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/applications/{id}/rating")
    @Operation(summary = "Set (1–5) or clear (null) the private rating")
    public ResponseEntity<ApplicationDTO> rate(@PathVariable UUID id, @RequestBody RatingRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(applicationService.rate(id, request.rating(), user));
    }

    @GetMapping("/applications/{id}/timeline")
    @Operation(summary = "Application history: stage changes (with the team's message), interviews and responses")
    public ResponseEntity<List<ApplicationEventDTO>> timeline(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(hiringService.timeline(id, user));
    }

    // Messages (candidate and hiring team)

    @GetMapping("/applications/{id}/messages")
    @Operation(summary = "Conversation between the candidate and the hiring team")
    public ResponseEntity<List<MessageDTO>> messages(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(hiringService.messages(id, user));
    }

    @PostMapping("/applications/{id}/messages")
    @Operation(summary = "Send a message; the hiring team may use {{candidateName}}, {{firstName}}, {{jobTitle}}, {{companyName}}, {{recruiterName}}")
    public ResponseEntity<MessageDTO> send(@PathVariable UUID id, @Valid @RequestBody TextRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hiringService.sendMessage(id, request.body(), user));
    }

    // Interviews

    @GetMapping("/applications/{id}/interviews")
    @Operation(summary = "Interviews for an application (candidate or hiring team)")
    public ResponseEntity<List<InterviewDTO>> interviews(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(hiringService.interviews(id, user));
    }

    @PostMapping("/applications/{id}/interviews")
    @Operation(summary = "Schedule an interview (moves the applicant to the Interview stage)")
    public ResponseEntity<InterviewDTO> schedule(@PathVariable UUID id, @Valid @RequestBody InterviewRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hiringService.schedule(id, request, user));
    }

    @PatchMapping("/interviews/{interviewId}")
    @Operation(summary = "Reschedule, edit, complete or cancel an interview")
    public ResponseEntity<InterviewDTO> updateInterview(@PathVariable UUID interviewId, @Valid @RequestBody InterviewRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(hiringService.updateInterview(interviewId, request, user));
    }

    @GetMapping("/applications/{id}/interviews/conflicts")
    @Operation(summary = "Interviews that would clash with a proposed time (for you or the candidate)")
    public ResponseEntity<List<InterviewConflictDTO>> conflicts(
        @PathVariable UUID id,
        @RequestParam java.time.Instant start,
        @RequestParam(defaultValue = "45") int durationMinutes,
        @RequestParam(required = false) UUID excludeInterviewId,
        @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(hiringService.conflicts(id, start, durationMinutes, excludeInterviewId, user));
    }

    /** 409 with the clashing interviews, so the client can show them and offer "Schedule anyway". */
    @ExceptionHandler(InterviewConflictException.class)
    public ResponseEntity<java.util.Map<String, Object>> handleConflict(InterviewConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(java.util.Map.of(
            "status", HttpStatus.CONFLICT.value(),
            "message", ex.getMessage(),
            "conflicts", ex.getConflicts()));
    }

    @PostMapping("/interviews/{interviewId}/respond")
    @Operation(summary = "Candidate: accept, decline, or ask for another time (1–3 suggestions)")
    public ResponseEntity<InterviewDTO> respond(@PathVariable UUID interviewId, @Valid @RequestBody RespondToInterviewRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(hiringService.respond(interviewId, request, user));
    }

    @GetMapping("/interviews/{interviewId}/video")
    @Operation(summary = "Join details (room URL + personal token) for the interview's NexHire video room")
    public ResponseEntity<VideoJoinDTO> joinVideo(@PathVariable UUID interviewId, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(hiringService.joinVideo(interviewId, user));
    }

    @GetMapping("/interviews/upcoming")
    @Operation(summary = "Upcoming interviews for the signed-in candidate or recruiter")
    public ResponseEntity<List<InterviewDTO>> upcoming(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(hiringService.upcoming(user));
    }

    // Templates (recruiters)

    @GetMapping("/message-templates")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<List<TemplateDTO>> templates(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(hiringService.templates(user));
    }

    @PostMapping("/message-templates")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<TemplateDTO> createTemplate(@Valid @RequestBody TemplateRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hiringService.createTemplate(request, user));
    }

    @PutMapping("/message-templates/{id}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<TemplateDTO> updateTemplate(@PathVariable UUID id, @Valid @RequestBody TemplateRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(hiringService.updateTemplate(id, request, user));
    }

    @DeleteMapping("/message-templates/{id}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTemplate(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        hiringService.deleteTemplate(id, user);
        return ResponseEntity.noContent().build();
    }

    // Analytics

    @GetMapping("/jobs/{id}/analytics")
    @Operation(summary = "Funnel and daily applications for one job (hiring team)")
    public ResponseEntity<JobAnalyticsDTO> analytics(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(hiringService.analytics(id, user));
    }
}
