package com.nexhire.api.modules.hiring;

import com.nexhire.api.modules.applications.Application;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "interviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Builder.Default
    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes = 45;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InterviewType type;

    /** Video link, phone number or office address. */
    @Column(length = 500)
    private String location;

    /** Shown to the candidate (preparation notes, who they'll meet…). */
    @Column(columnDefinition = "TEXT")
    private String message;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InterviewStatus status = InterviewStatus.SCHEDULED;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private InterviewResponse response = InterviewResponse.AWAITING;

    @Column(name = "response_note", columnDefinition = "TEXT")
    private String responseNote;

    /** JSON array of ISO instants suggested by the candidate. */
    @Column(name = "proposed_times", columnDefinition = "TEXT")
    private String proposedTimes;

    @Column(name = "responded_at")
    private Instant respondedAt;

    /** When the current time was sent to the candidate. */
    @Builder.Default
    @Column(name = "invited_at", nullable = false)
    private Instant invitedAt = Instant.now();

    @Column(name = "created_by")
    private UUID createdBy;

    /** Built-in video room (e.g. "DAILY"); null when using an external link. */
    @Column(name = "video_provider", length = 20)
    private String videoProvider;

    @Column(name = "video_room_name", length = 128)
    private String videoRoomName;

    @Column(name = "video_room_url", length = 500)
    private String videoRoomUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
