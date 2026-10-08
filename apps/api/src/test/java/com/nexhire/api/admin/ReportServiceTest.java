package com.nexhire.api.admin;

import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.modules.admin.*;
import com.nexhire.api.modules.admin.dto.CreateReportRequest;
import com.nexhire.api.modules.admin.dto.ResolveReportRequest;
import com.nexhire.api.modules.jobs.Job;
import com.nexhire.api.modules.jobs.JobRepository;
import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock private JobReportRepository reportRepository;
    @Mock private JobRepository jobRepository;
    @Mock private AuditService auditService;
    @InjectMocks private ReportService reportService;

    private User user(Role role) {
        return User.builder().id(UUID.randomUUID()).email(role + "@test.com").firstName("A").lastName("B").role(role).build();
    }

    private Job job(User recruiter) {
        return Job.builder().id(UUID.randomUUID()).title("Engineer").companyName("Acme").recruiter(recruiter).featured(true).build();
    }

    @Test
    void report_ownJob_isRejected() {
        User recruiter = user(Role.RECRUITER);
        Job job = job(recruiter);
        when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));

        assertThatThrownBy(() -> reportService.report(job.getId(), new CreateReportRequest(ReportReason.SPAM, null), recruiter))
            .isInstanceOf(BadRequestException.class);
        verify(reportRepository, never()).save(any());
    }

    @Test
    void report_twice_isRejected() {
        User candidate = user(Role.CANDIDATE);
        Job job = job(user(Role.RECRUITER));
        when(jobRepository.findById(job.getId())).thenReturn(Optional.of(job));
        when(reportRepository.existsByJobIdAndReporterId(job.getId(), candidate.getId())).thenReturn(true);

        assertThatThrownBy(() -> reportService.report(job.getId(), new CreateReportRequest(ReportReason.SCAM, "x"), candidate))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("already reported");
    }

    @Test
    void resolve_withHideJob_hidesJobAndAudits() {
        User admin = user(Role.ADMIN);
        Job job = job(user(Role.RECRUITER));
        JobReport report = JobReport.builder().id(UUID.randomUUID()).job(job).reporter(user(Role.CANDIDATE))
            .reason(ReportReason.SCAM).status(ReportStatus.OPEN).build();
        when(reportRepository.findById(report.getId())).thenReturn(Optional.of(report));

        var dto = reportService.resolve(report.getId(), new ResolveReportRequest(ReportStatus.RESOLVED, " confirmed ", true), admin);

        assertThat(job.isHidden()).isTrue();
        assertThat(job.isFeatured()).isFalse();
        assertThat(dto.status()).isEqualTo(ReportStatus.RESOLVED);
        assertThat(report.getResolutionNote()).isEqualTo("confirmed");
        assertThat(report.getResolvedBy()).isEqualTo(admin);
        verify(auditService).record(eq(admin), eq(AuditAction.JOB_HIDDEN), any(), eq(job.getId()), any(), any());
        verify(auditService).record(eq(admin), eq(AuditAction.REPORT_RESOLVED), any(), eq(report.getId()), any(), any());
    }

    @Test
    void resolve_alreadyReviewed_isRejected() {
        JobReport report = JobReport.builder().id(UUID.randomUUID()).job(job(user(Role.RECRUITER)))
            .reporter(user(Role.CANDIDATE)).reason(ReportReason.SPAM).status(ReportStatus.DISMISSED).build();
        when(reportRepository.findById(report.getId())).thenReturn(Optional.of(report));

        assertThatThrownBy(() -> reportService.resolve(report.getId(),
            new ResolveReportRequest(ReportStatus.RESOLVED, null, false), user(Role.ADMIN)))
            .isInstanceOf(BadRequestException.class);
    }
}
