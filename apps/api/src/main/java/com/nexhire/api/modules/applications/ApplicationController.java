package com.nexhire.api.modules.applications;

import com.nexhire.api.modules.applications.dto.ApplicationDTO;
import com.nexhire.api.modules.applications.dto.ApplicationStatsDTO;
import com.nexhire.api.modules.applications.dto.ApplyJobRequest;
import com.nexhire.api.modules.applications.dto.BulkUpdateStatusRequest;
import com.nexhire.api.modules.applications.dto.UpdateApplicationStatusRequest;
import com.nexhire.api.modules.users.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/applications")
@RequiredArgsConstructor
@Tag(name = "Applications", description = "Job application endpoints")
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Apply to a job")
    public ResponseEntity<ApplicationDTO> apply(
        @Valid @RequestBody ApplyJobRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(applicationService.apply(request, currentUser));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Get current candidate's applications")
    public ResponseEntity<Page<ApplicationDTO>> getMyApplications(
        @AuthenticationPrincipal User currentUser,
        Pageable pageable
    ) {
        return ResponseEntity.ok(applicationService.getMyApplications(currentUser.getId(), pageable));
    }

    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Get all applications for a job")
    public ResponseEntity<Page<ApplicationDTO>> getJobApplications(
        @PathVariable UUID jobId,
        @AuthenticationPrincipal User currentUser,
        Pageable pageable
    ) {
        return ResponseEntity.ok(applicationService.getJobApplications(jobId, currentUser, pageable));
    }

    @GetMapping("/recruiter")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Get all applications across recruiter's jobs")
    public ResponseEntity<Page<ApplicationDTO>> getRecruiterApplications(
        @AuthenticationPrincipal User currentUser,
        Pageable pageable
    ) {
        return ResponseEntity.ok(applicationService.getRecruiterApplications(currentUser.getId(), pageable));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update application status")
    public ResponseEntity<ApplicationDTO> updateStatus(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateApplicationStatusRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(applicationService.updateStatus(id, request, currentUser));
    }

    @PatchMapping("/bulk-status")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Bulk update application statuses")
    public ResponseEntity<List<ApplicationDTO>> bulkUpdateStatus(
        @Valid @RequestBody BulkUpdateStatusRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(applicationService.bulkUpdateStatus(request, currentUser));
    }

    @GetMapping("/recruiter/stats")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Get recruiter application pipeline stats")
    public ResponseEntity<ApplicationStatsDTO> getRecruiterStats(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(applicationService.getRecruiterStats(currentUser));
    }
}
