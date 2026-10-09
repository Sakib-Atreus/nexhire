package com.nexhire.api.modules.alerts;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobAlertRepository extends JpaRepository<JobAlert, UUID> {

    List<JobAlert> findByUserIdOrderByCreatedAtDesc(UUID userId);

    long countByUserId(UUID userId);

    List<JobAlert> findByActiveTrue();

    Optional<JobAlert> findByUnsubscribeToken(String token);
}
