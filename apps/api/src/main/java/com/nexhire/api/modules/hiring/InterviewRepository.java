package com.nexhire.api.modules.hiring;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, UUID> {

    List<Interview> findByApplicationIdOrderByScheduledAtAsc(UUID applicationId);

    Optional<Interview> findFirstByApplicationIdAndStatusAndScheduledAtAfterOrderByScheduledAtAsc(
        UUID applicationId, InterviewStatus status, Instant after);

    @Query("""
        SELECT i FROM Interview i JOIN FETCH i.application a JOIN FETCH a.job j
        WHERE a.candidate.id = :candidateId AND i.status = 'SCHEDULED' AND i.scheduledAt >= :from
        ORDER BY i.scheduledAt ASC
        """)
    List<Interview> upcomingForCandidate(@Param("candidateId") UUID candidateId, @Param("from") Instant from);

    @Query("""
        SELECT i FROM Interview i JOIN FETCH i.application a JOIN FETCH a.job j
        WHERE (j.recruiter.id = :userId OR j.company.id = :companyId)
        AND i.status = 'SCHEDULED' AND i.scheduledAt >= :from
        ORDER BY i.scheduledAt ASC
        """)
    List<Interview> upcomingForRecruiter(@Param("userId") UUID userId, @Param("companyId") UUID companyId, @Param("from") Instant from);

    /** Scheduled interviews created by this user that start inside [from, to). */
    @Query("""
        SELECT i FROM Interview i JOIN FETCH i.application a JOIN FETCH a.job JOIN FETCH a.candidate
        WHERE i.createdBy = :userId AND i.status = 'SCHEDULED' AND i.scheduledAt >= :from AND i.scheduledAt < :to
        """)
    List<Interview> scheduledByCreatorBetween(@Param("userId") UUID userId, @Param("from") Instant from, @Param("to") Instant to);

    /** A candidate's interviews (any status) starting in [from, to): calendar view. */
    @Query("""
        SELECT i FROM Interview i JOIN FETCH i.application a JOIN FETCH a.job j JOIN FETCH a.candidate
        WHERE a.candidate.id = :candidateId AND i.scheduledAt >= :from AND i.scheduledAt < :to
        ORDER BY i.scheduledAt ASC
        """)
    List<Interview> forCandidateBetween(@Param("candidateId") UUID candidateId, @Param("from") Instant from, @Param("to") Instant to);

    /** Interviews (any status) on jobs a recruiter manages, starting in [from, to): calendar view. */
    @Query("""
        SELECT i FROM Interview i JOIN FETCH i.application a JOIN FETCH a.job j JOIN FETCH a.candidate
        WHERE (j.recruiter.id = :userId OR j.company.id = :companyId) AND i.scheduledAt >= :from AND i.scheduledAt < :to
        ORDER BY i.scheduledAt ASC
        """)
    List<Interview> forRecruiterBetween(@Param("userId") UUID userId, @Param("companyId") UUID companyId,
                                        @Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT COUNT(DISTINCT i.application.id) FROM Interview i WHERE i.application.job.id = :jobId AND i.status <> 'CANCELLED'")
    long countInterviewedApplications(@Param("jobId") UUID jobId);
}
