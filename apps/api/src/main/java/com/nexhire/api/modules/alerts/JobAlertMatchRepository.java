package com.nexhire.api.modules.alerts;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobAlertMatchRepository extends JpaRepository<JobAlertMatch, UUID> {

    boolean existsByAlertIdAndJobId(UUID alertId, UUID jobId);

    /** Alerts with queued (unsent) matches, a page at a time. */
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT m.alertId FROM JobAlertMatch m WHERE m.sent = false")
    List<UUID> pendingAlertIds(org.springframework.data.domain.Pageable pageable);

    List<JobAlertMatch> findByAlertIdAndSentFalseOrderByCreatedAtAsc(UUID alertId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE JobAlertMatch m SET m.sent = true WHERE m.alertId = :alertId AND m.sent = false")
    int markSent(@org.springframework.data.repository.query.Param("alertId") UUID alertId);
}
