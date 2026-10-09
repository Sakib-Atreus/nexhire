package com.nexhire.api.modules.timeline;

import com.nexhire.api.modules.applications.ApplicationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/** One step in an application's history, shown as a timeline to the candidate and the hiring team. */
@Entity
@Table(name = "application_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ApplicationEventType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private ApplicationStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", length = 30)
    private ApplicationStatus toStatus;

    /** Message from the hiring team to the candidate, or context such as the interview time. */
    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "actor_name")
    private String actorName;

    @Builder.Default
    @Column(name = "visible_to_candidate", nullable = false)
    private boolean visibleToCandidate = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
