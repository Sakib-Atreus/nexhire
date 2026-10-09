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

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"job", "candidate"})
    Page<Application> findByCandidateId(UUID candidateId, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"job", "candidate"})
    Page<Application> findByJobId(UUID jobId, Pageable pageable);

    Page<Application> findByJobRecruiterId(UUID recruiterId, Pageable pageable);

    Optional<Application> findByJobIdAndCandidateId(UUID jobId, UUID candidateId);

    boolean existsByJobIdAndCandidateId(UUID jobId, UUID candidateId);

    long countByJobId(UUID jobId);

    /** [jobId, count] for a page of jobs in one query. */
    @Query("SELECT a.job.id, COUNT(a) FROM Application a WHERE a.job.id IN :jobIds GROUP BY a.job.id")
    java.util.List<Object[]> countByJobIds(@Param("jobIds") java.util.Collection<UUID> jobIds);

    long countByJobIdAndStatus(UUID jobId, ApplicationStatus status);

    /** Applications on jobs the recruiter manages (own jobs + company jobs; pass JobAccess.NO_COMPANY when none). */
    @Query("SELECT a FROM Application a WHERE a.job.recruiter.id = :userId OR a.job.company.id = :companyId")
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"job", "candidate"})
    Page<Application> findManagedBy(@Param("userId") UUID userId, @Param("companyId") UUID companyId, Pageable pageable);

    @Query("SELECT COUNT(a) FROM Application a WHERE (a.job.recruiter.id = :userId OR a.job.company.id = :companyId) AND a.status = :status")
    long countManagedByStatus(@Param("userId") UUID userId, @Param("companyId") UUID companyId, @Param("status") ApplicationStatus status);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.job.recruiter.id = :userId OR a.job.company.id = :companyId")
    long countManaged(@Param("userId") UUID userId, @Param("companyId") UUID companyId);

    /** [yyyy-MM-dd, count] applications per day for one job since the given time. */
    @Query(value = """
        SELECT to_char(applied_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(*) AS total
        FROM applications WHERE job_id = :jobId AND applied_at >= :since GROUP BY day ORDER BY day
        """, nativeQuery = true)
    java.util.List<Object[]> countPerDayForJob(@Param("jobId") UUID jobId, @Param("since") java.time.Instant since);

    @Query("SELECT AVG(a.rating) FROM Application a WHERE a.job.id = :jobId AND a.rating IS NOT NULL")
    Double averageRating(@Param("jobId") UUID jobId);

    long countByStatus(ApplicationStatus status);

    /** [status, count] across all applications. */
    @Query("SELECT a.status, COUNT(a) FROM Application a GROUP BY a.status")
    java.util.List<Object[]> countGroupedByStatus();

    /** [status, count] across the jobs a recruiter manages (own + company team). */
    @Query("SELECT a.status, COUNT(a) FROM Application a WHERE a.job.recruiter.id = :userId OR a.job.company.id = :companyId GROUP BY a.status")
    java.util.List<Object[]> countManagedGroupedByStatus(@Param("userId") UUID userId, @Param("companyId") UUID companyId);

    /** [status, count] for one candidate's applications. */
    @Query("SELECT a.status, COUNT(a) FROM Application a WHERE a.candidate.id = :candidateId GROUP BY a.status")
    java.util.List<Object[]> countCandidateGroupedByStatus(@Param("candidateId") UUID candidateId);

    long countByCandidateId(UUID candidateId);

    @Query("SELECT a.job.id FROM Application a WHERE a.candidate.id = :candidateId")
    java.util.List<UUID> findJobIdsByCandidateId(@Param("candidateId") UUID candidateId);

    long countByAppliedAtAfter(java.time.Instant since);

    java.util.List<Application> findTop5ByCandidateIdOrderByAppliedAtDesc(UUID candidateId);

    /** [yyyy-MM-dd, count] rows for applications since the given time. */
    @Query(value = """
        SELECT to_char(applied_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(*) AS total
        FROM applications WHERE applied_at >= :since GROUP BY day ORDER BY day
        """, nativeQuery = true)
    java.util.List<Object[]> countApplicationsPerDay(@Param("since") java.time.Instant since);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.job.recruiter.id = :recruiterId AND a.status = :status")
    long countByRecruiterIdAndStatus(@Param("recruiterId") UUID recruiterId, @Param("status") ApplicationStatus status);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.job.recruiter.id = :recruiterId")
    long countByRecruiterId(@Param("recruiterId") UUID recruiterId);
}
