package com.nexhire.api.modules.admin;

import com.nexhire.api.modules.admin.dto.CreateReportRequest;
import com.nexhire.api.modules.admin.dto.JobReportDTO;
import com.nexhire.api.modules.admin.dto.PublicSettingsDTO;
import com.nexhire.api.modules.users.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** Non-admin endpoints owned by the admin module: public settings and job reporting. */
@RestController
@RequiredArgsConstructor
@Tag(name = "Site", description = "Public site settings and job reports")
public class PublicController {

    private final SettingsService settingsService;
    private final ReportService reportService;

    @GetMapping("/settings/public")
    @Operation(summary = "Announcement banner, job categories and skills (no login required)")
    public ResponseEntity<PublicSettingsDTO> settings() {
        return ResponseEntity.ok(settingsService.getPublic());
    }

    @PostMapping("/jobs/{id}/report")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Report a job posting to the moderators")
    public ResponseEntity<JobReportDTO> report(
        @PathVariable UUID id,
        @Valid @RequestBody CreateReportRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.report(id, request, currentUser));
    }
}
