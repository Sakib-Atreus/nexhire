package com.nexhire.api.modules.jobs;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, UUID> {

    Optional<SavedJob> findByUserIdAndJobId(UUID userId, UUID jobId);

    Page<SavedJob> findByUserId(UUID userId, Pageable pageable);

    void deleteByUserIdAndJobId(UUID userId, UUID jobId);

    boolean existsByUserIdAndJobId(UUID userId, UUID jobId);

    /** Which of these jobs the user has saved (one query for a whole page). */
    @org.springframework.data.jpa.repository.Query("SELECT s.job.id FROM SavedJob s WHERE s.user.id = :userId AND s.job.id IN :jobIds")
    java.util.Set<UUID> savedAmong(@org.springframework.data.repository.query.Param("userId") UUID userId,
                                   @org.springframework.data.repository.query.Param("jobIds") java.util.Collection<UUID> jobIds);
}
