package com.nexhire.api.modules.jobs;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID>, JpaSpecificationExecutor<Job> {

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
    @Transactional
    @Query("UPDATE Job j SET j.viewCount = j.viewCount + 1 WHERE j.id = :id")
    void incrementViewCount(@Param("id") UUID id);

    @Query(value = """
        SELECT j FROM Job j JOIN FETCH j.recruiter
        WHERE j.status = :status
        AND (CAST(:keyword AS String) IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%'))
             OR LOWER(j.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%')))
        AND (CAST(:location AS String) IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', CAST(:location AS String), '%')))
        AND (CAST(:companyName AS String) IS NULL OR LOWER(j.companyName) LIKE LOWER(CONCAT('%', CAST(:companyName AS String), '%')))
        AND (:jobType IS NULL OR j.jobType = :jobType)
        AND (:experienceLevel IS NULL OR j.experienceLevel = :experienceLevel)
        AND (:salaryMin IS NULL OR j.salaryMin >= :salaryMin)
        AND (:salaryMax IS NULL OR j.salaryMax <= :salaryMax)
        AND j.hidden = false
        AND (CAST(:category AS String) IS NULL OR j.category = CAST(:category AS String))
        AND (:featuredOnly = false OR j.featured = true)
        ORDER BY j.featured DESC
        """,
        countQuery = """
        SELECT COUNT(j) FROM Job j
        WHERE j.status = :status
        AND (CAST(:keyword AS String) IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%'))
             OR LOWER(j.description) LIKE LOWER(CONCAT('%', CAST(:keyword AS String), '%')))
        AND (CAST(:location AS String) IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', CAST(:location AS String), '%')))
        AND (CAST(:companyName AS String) IS NULL OR LOWER(j.companyName) LIKE LOWER(CONCAT('%', CAST(:companyName AS String), '%')))
        AND (:jobType IS NULL OR j.jobType = :jobType)
        AND (:experienceLevel IS NULL OR j.experienceLevel = :experienceLevel)
        AND (:salaryMin IS NULL OR j.salaryMin >= :salaryMin)
        AND (:salaryMax IS NULL OR j.salaryMax <= :salaryMax)
        AND j.hidden = false
        AND (CAST(:category AS String) IS NULL OR j.category = CAST(:category AS String))
        AND (:featuredOnly = false OR j.featured = true)
        """)
    Page<Job> searchExtended(
        @Param("status") JobStatus status,
        @Param("keyword") String keyword,
        @Param("location") String location,
        @Param("companyName") String companyName,
        @Param("jobType") JobType jobType,
        @Param("experienceLevel") ExperienceLevel experienceLevel,
        @Param("salaryMin") java.math.BigDecimal salaryMin,
        @Param("salaryMax") java.math.BigDecimal salaryMax,
        @Param("category") String category,
        @Param("featuredOnly") boolean featuredOnly,
        Pageable pageable
    );

    long countByStatus(JobStatus status);

    long countByHiddenTrue();

    long countByFeaturedTrue();

    long countByRecruiterId(UUID recruiterId);

    long countByCompanyIdAndStatusAndHiddenFalse(UUID companyId, JobStatus status);

    /** Candidate pool for recommendations: newest open, visible jobs. */
    java.util.List<Job> findTop300ByStatusAndHiddenFalseOrderByCreatedAtDesc(JobStatus status);

    java.util.List<Job> findTop50ByCompanyIdAndStatusAndHiddenFalseOrderByFeaturedDescCreatedAtDesc(UUID companyId, JobStatus status);

    /** Jobs a recruiter manages: their own, plus every job of their company (pass JobAccess.NO_COMPANY when none). */
    @Query("SELECT j FROM Job j WHERE j.recruiter.id = :userId OR j.company.id = :companyId")
    Page<Job> findManagedBy(@Param("userId") UUID userId, @Param("companyId") UUID companyId, Pageable pageable);

    /** Keep the denormalized company name/logo on jobs in sync with the company profile. */
    @Modifying
    @Query("UPDATE Job j SET j.companyName = :name, j.companyLogoUrl = :logoUrl WHERE j.company.id = :companyId")
    int syncCompanyDetails(@Param("companyId") UUID companyId, @Param("name") String name, @Param("logoUrl") String logoUrl);

    java.util.List<Job> findTop5ByRecruiterIdOrderByCreatedAtDesc(UUID recruiterId);

    /** [companyName, openJobs, applications] for the companies with the most applications. */
    @Query(value = """
        SELECT j.company_name,
               COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'OPEN') AS open_jobs,
               COUNT(a.id) AS applications
        FROM jobs j LEFT JOIN applications a ON a.job_id = j.id
        GROUP BY j.company_name
        ORDER BY applications DESC, open_jobs DESC
        LIMIT :limit
        """, nativeQuery = true)
    java.util.List<Object[]> topCompanies(@Param("limit") int limit);

    @Query("SELECT j FROM Job j WHERE j.status = 'OPEN' AND j.deadline IS NOT NULL AND j.deadline < :now")
    java.util.List<Job> findExpiredOpenJobs(@Param("now") java.time.LocalDate now);
}
