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

    /**
     * Active alerts whose exact-match filters (category, job type, level) fit the job; keyword and
     * location are checked in Java. Paged so matching never loads every alert at once.
     */
    @org.springframework.data.jpa.repository.Query("""
        SELECT a FROM JobAlert a
        WHERE a.active = true
          AND (a.category IS NULL OR LOWER(a.category) = LOWER(CAST(:category AS String)))
          AND (a.jobType IS NULL OR a.jobType = :jobType)
          AND (a.experienceLevel IS NULL OR a.experienceLevel = :level)
        ORDER BY a.id
        """)
    org.springframework.data.domain.Slice<JobAlert> candidatesFor(
        @org.springframework.data.repository.query.Param("category") String category,
        @org.springframework.data.repository.query.Param("jobType") com.nexhire.api.modules.jobs.JobType jobType,
        @org.springframework.data.repository.query.Param("level") com.nexhire.api.modules.jobs.ExperienceLevel level,
        org.springframework.data.domain.Pageable pageable);

    Optional<JobAlert> findByUnsubscribeToken(String token);
}
