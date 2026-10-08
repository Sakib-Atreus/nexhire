package com.nexhire.api.modules.hiring;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/** A message in the conversation between the hiring team and the candidate on one application. */
@Entity
@Table(name = "application_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "sender_id")
    private UUID senderId;

    @Column(name = "sender_name")
    private String senderName;

    @Column(name = "from_candidate", nullable = false)
    private boolean fromCandidate;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
