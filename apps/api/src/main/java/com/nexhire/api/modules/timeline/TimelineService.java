package com.nexhire.api.modules.timeline;

import com.nexhire.api.modules.applications.ApplicationStatus;
import com.nexhire.api.modules.users.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Records and reads application history. Recording joins the caller's transaction. */
@Service
@RequiredArgsConstructor
public class TimelineService {

    private final ApplicationEventRepository repository;

    @Transactional(propagation = Propagation.REQUIRED)
    public void record(UUID applicationId, ApplicationEventType type, ApplicationStatus from, ApplicationStatus to,
                       String note, User actor) {
        repository.save(ApplicationEvent.builder()
            .applicationId(applicationId)
            .type(type)
            .fromStatus(from)
            .toStatus(to)
            .note(note == null || note.isBlank() ? null : note.trim())
            .actorName(actor != null ? actor.getFullName() : null)
            .build());
    }

    @Transactional(readOnly = true)
    public List<ApplicationEventDTO> events(UUID applicationId, boolean candidateView) {
        List<ApplicationEvent> events = candidateView
            ? repository.findByApplicationIdAndVisibleToCandidateTrueOrderByCreatedAtAsc(applicationId)
            : repository.findByApplicationIdOrderByCreatedAtAsc(applicationId);
        return events.stream()
            .map(e -> new ApplicationEventDTO(e.getId(), e.getType(), e.getFromStatus(), e.getToStatus(), e.getNote(),
                e.getActorName(), e.getCreatedAt()))
            .toList();
    }
}
