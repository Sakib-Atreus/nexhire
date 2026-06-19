package com.nexhire.api.modules.applications;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    Page<Application> findByCandidateId(UUID candidateId, Pageable pageable);

    Page<Application> findByJobId(UUID jobId, Pageable pageable);

    Page<Application> findByJobRecruiterId(UUID recruiterId, Pageable pageable);

    Optional<Application> findByJobIdAndCandidateId(UUID jobId, UUID candidateId);

    boolean existsByJobIdAndCandidateId(UUID jobId, UUID candidateId);

    long countByJobId(UUID jobId);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.job.recruiter.id = :recruiterId AND a.status = :status")
    long countByRecruiterIdAndStatus(@Param("recruiterId") UUID recruiterId, @Param("status") ApplicationStatus status);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.job.recruiter.id = :recruiterId")
    long countByRecruiterId(@Param("recruiterId") UUID recruiterId);
}
