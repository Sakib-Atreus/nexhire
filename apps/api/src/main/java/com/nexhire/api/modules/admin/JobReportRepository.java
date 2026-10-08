package com.nexhire.api.modules.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface JobReportRepository extends JpaRepository<JobReport, UUID> {

    boolean existsByJobIdAndReporterId(UUID jobId, UUID reporterId);

    Page<JobReport> findByStatus(ReportStatus status, Pageable pageable);

    long countByStatus(ReportStatus status);

    long countByJobIdAndStatus(UUID jobId, ReportStatus status);

    long countByReporterId(UUID reporterId);
}
