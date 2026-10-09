package com.nexhire.api.modules.alerts;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobAlertMatchRepository extends JpaRepository<JobAlertMatch, UUID> {

    boolean existsByAlertIdAndJobId(UUID alertId, UUID jobId);

    List<JobAlertMatch> findBySentFalseOrderByCreatedAtAsc();
}
