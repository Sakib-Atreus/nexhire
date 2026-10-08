package com.nexhire.api.modules.jobs;

import com.nexhire.api.modules.jobs.dto.CreateJobRequest;
import com.nexhire.api.modules.jobs.dto.JobDTO;
import com.nexhire.api.modules.jobs.dto.UpdateJobRequest;
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

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs", description = "Job posting endpoints")
public class JobController {

    private final JobService jobService;

    @GetMapping
    @Operation(summary = "Search and list open jobs")
    public ResponseEntity<Page<JobDTO>> search(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String location,
        @RequestParam(required = false) String companyName,
        @RequestParam(required = false) JobType jobType,
        @RequestParam(required = false) ExperienceLevel experienceLevel,
        @RequestParam(required = false) BigDecimal salaryMin,
        @RequestParam(required = false) BigDecimal salaryMax,
        @RequestParam(required = false) String category,
        @RequestParam(defaultValue = "false") boolean featured,
        Pageable pageable,
        @AuthenticationPrincipal User currentUser
    ) {
        UUID userId = currentUser != null ? currentUser.getId() : null;
        return ResponseEntity.ok(jobService.search(keyword, location, companyName, jobType, experienceLevel,
            salaryMin, salaryMax, category, featured, pageable, userId));
    }

    @GetMapping("/saved")
    @PreAuthorize("hasRole('CANDIDATE') or hasRole('ADMIN')")
    @Operation(summary = "Get saved jobs for authenticated candidate")
    public ResponseEntity<Page<JobDTO>> getSavedJobs(
        @AuthenticationPrincipal User currentUser,
        Pageable pageable
    ) {
        return ResponseEntity.ok(jobService.getSavedJobs(currentUser.getId(), pageable));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Get recruiter's own jobs")
    public ResponseEntity<Page<JobDTO>> getMyJobs(
        @AuthenticationPrincipal User currentUser,
        Pageable pageable
    ) {
        return ResponseEntity.ok(jobService.getByRecruiter(currentUser, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get job by ID")
    public ResponseEntity<JobDTO> getById(
        @PathVariable UUID id,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(jobService.getByIdForUser(id, currentUser));
    }

    @PostMapping
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Create a new job posting")
    public ResponseEntity<JobDTO> create(
        @Valid @RequestBody CreateJobRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.create(request, currentUser));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Update a job posting")
    public ResponseEntity<JobDTO> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateJobRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(jobService.update(id, request, currentUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Delete a job posting")
    public ResponseEntity<Void> delete(
        @PathVariable UUID id,
        @AuthenticationPrincipal User currentUser
    ) {
        jobService.delete(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/duplicate")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Copy a job as a new draft")
    public ResponseEntity<JobDTO> duplicate(@PathVariable UUID id, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.duplicate(id, currentUser));
    }

    @PostMapping("/{id}/save")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Save a job for later")
    public ResponseEntity<JobDTO> saveJob(
        @PathVariable UUID id,
        @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(jobService.saveJob(id, currentUser));
    }

    @DeleteMapping("/{id}/save")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Remove a saved job")
    public ResponseEntity<Void> unsaveJob(
        @PathVariable UUID id,
        @AuthenticationPrincipal User currentUser
    ) {
        jobService.unsaveJob(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
}
