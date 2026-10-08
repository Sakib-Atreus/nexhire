package com.nexhire.api.modules.admin;

import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.exception.ResourceNotFoundException;
import com.nexhire.api.modules.admin.dto.CreateReportRequest;
import com.nexhire.api.modules.admin.dto.JobReportDTO;
import com.nexhire.api.modules.admin.dto.ResolveReportRequest;
import com.nexhire.api.modules.jobs.Job;
import com.nexhire.api.modules.jobs.JobRepository;
import com.nexhire.api.modules.users.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final JobReportRepository reportRepository;
    private final JobRepository jobRepository;
    private final AuditService auditService;

    @Transactional
    public JobReportDTO report(UUID jobId, CreateReportRequest request, User reporter) {
        Job job = jobRepository.findById(jobId)
            .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));
        if (job.getRecruiter().getId().equals(reporter.getId())) {
            throw new BadRequestException("You can't report your own job");
        }
        if (reportRepository.existsByJobIdAndReporterId(jobId, reporter.getId())) {
            throw new BadRequestException("You have already reported this job. Our team will review it.");
        }
        String details = request.details() == null ? null : request.details().trim();
        JobReport saved = reportRepository.save(JobReport.builder()
            .job(job)
            .reporter(reporter)
            .reason(request.reason())
            .details(details == null || details.isEmpty() ? null : details)
            .build());
        return toDTO(saved);
    }

    public Page<JobReportDTO> list(ReportStatus status, Pageable pageable) {
        Pageable sorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<JobReport> page = status != null ? reportRepository.findByStatus(status, sorted) : reportRepository.findAll(sorted);
        return page.map(this::toDTO);
    }

    @Transactional
    public JobReportDTO resolve(UUID reportId, ResolveReportRequest request, User admin) {
        if (request.status() == ReportStatus.OPEN) {
            throw new BadRequestException("Choose RESOLVED or DISMISSED");
        }
        JobReport report = reportRepository.findById(reportId)
            .orElseThrow(() -> new ResourceNotFoundException("Report", "id", reportId));
        if (report.getStatus() != ReportStatus.OPEN) {
            throw new BadRequestException("This report has already been reviewed");
        }

        Job job = report.getJob();
        if (request.hideJob() && !job.isHidden()) {
            job.setHidden(true);
            job.setFeatured(false); // hidden jobs can't stay featured (same rule as JobService.moderate)
            jobRepository.save(job);
            auditService.record(admin, AuditAction.JOB_HIDDEN, AuditService.TARGET_JOB, job.getId(), job.getTitle(),
                "Hidden after report (" + report.getReason() + ")");
        }

        String note = request.note() == null ? null : request.note().trim();
        report.setStatus(request.status());
        report.setResolutionNote(note == null || note.isEmpty() ? null : note);
        report.setResolvedBy(admin);
        report.setResolvedAt(Instant.now());
        reportRepository.save(report);

        auditService.record(admin,
            request.status() == ReportStatus.RESOLVED ? AuditAction.REPORT_RESOLVED : AuditAction.REPORT_DISMISSED,
            AuditService.TARGET_REPORT, report.getId(), job.getTitle(),
            report.getReason() + (report.getResolutionNote() != null ? ": " + report.getResolutionNote() : ""));
        return toDTO(report);
    }

    public long countOpen() {
        return reportRepository.countByStatus(ReportStatus.OPEN);
    }

    private JobReportDTO toDTO(JobReport r) {
        Job job = r.getJob();
        User reporter = r.getReporter();
        return new JobReportDTO(
            r.getId(), job.getId(), job.getTitle(), job.getCompanyName(), job.isHidden(),
            reportRepository.countByJobIdAndStatus(job.getId(), ReportStatus.OPEN),
            reporter.getId(), reporter.getFullName(), reporter.getEmail(),
            r.getReason(), r.getDetails(), r.getStatus(), r.getResolutionNote(),
            r.getResolvedBy() != null ? r.getResolvedBy().getFullName() : null,
            r.getResolvedAt(), r.getCreatedAt());
    }
}
