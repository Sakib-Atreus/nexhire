package com.nexhire.api.modules.alerts;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/** A job that matched an alert. Unique per (alert, job) so nobody is alerted twice; unsent rows feed the daily digest. */
@Entity
@Table(name = "job_alert_matches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobAlertMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "alert_id", nullable = false)
    private UUID alertId;

    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    @Builder.Default
    @Column(nullable = false)
    private boolean sent = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
