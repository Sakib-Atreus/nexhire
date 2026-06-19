package com.nexhire.api.modules.jobs;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {

    Page<Job> findByStatus(JobStatus status, Pageable pageable);

    Page<Job> findByRecruiterId(UUID recruiterId, Pageable pageable);

    @Query(value = """
        SELECT j FROM Job j JOIN FETCH j.recruiter
        WHERE j.status = :status
        AND (CAST(:keyword AS String) IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%'))
             OR LOWER(j.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%')))
        AND (CAST(:location AS String) IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', CAST(:location AS String), '%')))
        AND (:jobType IS NULL OR j.jobType = :jobType)
        AND (:experienceLevel IS NULL OR j.experienceLevel = :experienceLevel)
        """,
        countQuery = """
        SELECT COUNT(j) FROM Job j
        WHERE j.status = :status
        AND (CAST(:keyword AS String) IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%'))
             OR LOWER(j.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%')))
        AND (CAST(:location AS String) IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', CAST(:location AS String), '%')))
        AND (:jobType IS NULL OR j.jobType = :jobType)
        AND (:experienceLevel IS NULL OR j.experienceLevel = :experienceLevel)
        """)
    Page<Job> search(
        @Param("status") JobStatus status,
        @Param("keyword") String keyword,
        @Param("location") String location,
        @Param("jobType") JobType jobType,
        @Param("experienceLevel") ExperienceLevel experienceLevel,
        Pageable pageable
    );

    @Modifying
    @Query("UPDATE Job j SET j.viewCount = j.viewCount + 1 WHERE j.id = :id")
    void incrementViewCount(@Param("id") UUID id);

    @Query(value = """
        SELECT j FROM Job j JOIN FETCH j.recruiter
        WHERE j.status = :status
        AND (CAST(:keyword AS String) IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%'))
             OR LOWER(j.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%')))
        AND (CAST(:location AS String) IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', CAST(:location AS String), '%')))
        AND (:jobType IS NULL OR j.jobType = :jobType)
        AND (:experienceLevel IS NULL OR j.experienceLevel = :experienceLevel)
        AND (:salaryMin IS NULL OR j.salaryMin >= :salaryMin)
        AND (:salaryMax IS NULL OR j.salaryMax <= :salaryMax)
        """,
        countQuery = """
        SELECT COUNT(j) FROM Job j
        WHERE j.status = :status
        AND (CAST(:keyword AS String) IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%'))
             OR LOWER(j.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%')))
        AND (CAST(:location AS String) IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', CAST(:location AS String), '%')))
        AND (:jobType IS NULL OR j.jobType = :jobType)
        AND (:experienceLevel IS NULL OR j.experienceLevel = :experienceLevel)
        AND (:salaryMin IS NULL OR j.salaryMin >= :salaryMin)
        AND (:salaryMax IS NULL OR j.salaryMax <= :salaryMax)
        """)
    Page<Job> searchExtended(
        @Param("status") JobStatus status,
        @Param("keyword") String keyword,
        @Param("location") String location,
        @Param("jobType") JobType jobType,
        @Param("experienceLevel") ExperienceLevel experienceLevel,
        @Param("salaryMin") java.math.BigDecimal salaryMin,
        @Param("salaryMax") java.math.BigDecimal salaryMax,
        Pageable pageable
    );

    @Query("SELECT j FROM Job j WHERE j.status = 'OPEN' AND j.deadline IS NOT NULL AND j.deadline < :now")
    java.util.List<Job> findExpiredOpenJobs(@Param("now") java.time.LocalDate now);
}
