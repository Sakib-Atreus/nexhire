package com.nexhire.api.modules.admin;

import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.modules.admin.dto.*;
import com.nexhire.api.modules.jobs.JobService;
import com.nexhire.api.modules.jobs.JobStatus;
import com.nexhire.api.modules.jobs.dto.JobDTO;
import com.nexhire.api.modules.jobs.dto.JobModerationRequest;
import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import com.nexhire.api.modules.users.UserService;
import com.nexhire.api.modules.users.dto.UserDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Platform administration (ADMIN only)")
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;
    private final JobService jobService;
    private final ReportService reportService;
    private final AuditService auditService;
    private final SettingsService settingsService;
    private final com.nexhire.api.modules.companies.CompanyService companyService;

    // ─── Overview ───────────────────────────────────────────────────────────

    @GetMapping("/overview")
    @Operation(summary = "Platform statistics for the admin dashboard")
    public ResponseEntity<AdminOverviewDTO> overview() {
        return ResponseEntity.ok(adminService.overview());
    }

    // ─── Users ──────────────────────────────────────────────────────────────

    @GetMapping("/users")
    @Operation(summary = "Search users by name/email, role, status (active|suspended) and verification")
    public ResponseEntity<Page<UserDTO>> users(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) Role role,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) Boolean verified,
        Pageable pageable
    ) {
        return ResponseEntity.ok(adminService.searchUsers(q, role, status, verified, pageable));
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "User profile with activity and admin history")
    public ResponseEntity<AdminUserDetailDTO> user(@PathVariable UUID id) {
        return ResponseEntity.ok(adminService.userDetail(id));
    }

    @PatchMapping("/users/{id}/verified")
    @Operation(summary = "Mark a recruiter as verified (or remove verification)")
    public ResponseEntity<UserDTO> verify(
        @PathVariable UUID id,
        @RequestBody VerifyUserRequest request,
        @AuthenticationPrincipal User admin
    ) {
        return ResponseEntity.ok(userService.setVerified(id, request.verified(), admin));
    }

    // ─── Jobs ───────────────────────────────────────────────────────────────

    @GetMapping("/jobs")
    @Operation(summary = "All jobs, including hidden and closed ones")
    public ResponseEntity<Page<JobDTO>> jobs(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) JobStatus status,
        @RequestParam(required = false) Boolean hidden,
        @RequestParam(required = false) Boolean featured,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) UUID recruiterId,
        Pageable pageable
    ) {
        return ResponseEntity.ok(jobService.adminSearch(q, status, hidden, featured, category, recruiterId, pageable));
    }

    @PatchMapping("/jobs/{id}")
    @Operation(summary = "Hide, feature or change the status of a job")
    public ResponseEntity<JobDTO> moderateJob(
        @PathVariable UUID id,
        @Valid @RequestBody JobModerationRequest request,
        @AuthenticationPrincipal User admin
    ) {
        return ResponseEntity.ok(jobService.moderate(id, request, admin));
    }

    // ─── Companies ──────────────────────────────────────────────────────────

    @GetMapping("/companies")
    @Operation(summary = "All companies; filter by name/industry and verification")
    public ResponseEntity<Page<com.nexhire.api.modules.companies.dto.CompanyDTO>> companies(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) Boolean verified,
        Pageable pageable
    ) {
        return ResponseEntity.ok(companyService.search(q, verified, pageable));
    }

    @PatchMapping("/companies/{id}/verified")
    @Operation(summary = "Verify a company (or remove verification)")
    public ResponseEntity<com.nexhire.api.modules.companies.dto.CompanyDTO> verifyCompany(
        @PathVariable UUID id,
        @RequestBody VerifyUserRequest request,
        @AuthenticationPrincipal User admin
    ) {
        return ResponseEntity.ok(companyService.setVerified(id, request.verified(), admin));
    }

    // ─── Reports ────────────────────────────────────────────────────────────

    @GetMapping("/reports")
    @Operation(summary = "Job reports, newest first; filter by status")
    public ResponseEntity<Page<JobReportDTO>> reports(@RequestParam(required = false) ReportStatus status, Pageable pageable) {
        return ResponseEntity.ok(reportService.list(status, pageable));
    }

    @PatchMapping("/reports/{id}")
    @Operation(summary = "Resolve or dismiss a report, optionally hiding the job")
    public ResponseEntity<JobReportDTO> resolveReport(
        @PathVariable UUID id,
        @Valid @RequestBody ResolveReportRequest request,
        @AuthenticationPrincipal User admin
    ) {
        return ResponseEntity.ok(reportService.resolve(id, request, admin));
    }

    // ─── Audit log ──────────────────────────────────────────────────────────

    @GetMapping("/audit")
    @Operation(summary = "Admin action history, newest first")
    public ResponseEntity<Page<AuditLogDTO>> audit(
        @RequestParam(required = false) AuditAction action,
        @RequestParam(required = false) String targetType,
        @RequestParam(required = false) UUID targetId,
        @RequestParam(required = false) String actor,
        Pageable pageable
    ) {
        return ResponseEntity.ok(auditService.search(action, targetType, targetId, actor, pageable));
    }

    // ─── Settings ───────────────────────────────────────────────────────────

    @PutMapping("/settings/announcement")
    @Operation(summary = "Update the site-wide announcement banner")
    public ResponseEntity<Announcement> announcement(@Valid @RequestBody Announcement request, @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(settingsService.updateAnnouncement(request, admin));
    }

    @PutMapping("/settings/{key}")
    @Operation(summary = "Replace the job categories or skills list")
    public ResponseEntity<List<String>> list(
        @PathVariable String key,
        @Valid @RequestBody UpdateListRequest request,
        @AuthenticationPrincipal User admin
    ) {
        if (!SettingsService.CATEGORIES.equals(key) && !SettingsService.SKILLS.equals(key)) {
            throw new BadRequestException("Unknown setting: " + key);
        }
        return ResponseEntity.ok(settingsService.updateList(key, request.items(), admin));
    }
}
