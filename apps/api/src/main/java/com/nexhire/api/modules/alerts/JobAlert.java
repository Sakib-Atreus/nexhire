package com.nexhire.api.modules.alerts;

import com.nexhire.api.modules.jobs.ExperienceLevel;
import com.nexhire.api.modules.jobs.JobType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/** A saved job search; the candidate is told when new matching jobs are published. */
@Entity
@Table(name = "job_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 100)
    private String keyword;

    @Column(length = 100)
    private String location;

    @Column(length = 50)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", length = 20)
    private JobType jobType;

    @Enumerated(EnumType.STRING)
    @Column(name = "experience_level", length = 20)
    private ExperienceLevel experienceLevel;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AlertFrequency frequency = AlertFrequency.DAILY;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Builder.Default
    @Column(name = "email_enabled", nullable = false)
    private boolean emailEnabled = true;

    @Column(name = "unsubscribe_token", nullable = false, unique = true, length = 64)
    private String unsubscribeToken;

    @Column(name = "last_sent_at")
    private Instant lastSentAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
