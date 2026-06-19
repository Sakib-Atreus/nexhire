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
}
