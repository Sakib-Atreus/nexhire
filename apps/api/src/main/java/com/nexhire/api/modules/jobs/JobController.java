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
        @RequestParam(required = false) JobType jobType,
        @RequestParam(required = false) ExperienceLevel experienceLevel,
        Pageable pageable
    ) {
        return ResponseEntity.ok(jobService.search(keyword, location, jobType, experienceLevel, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get job by ID")
    public ResponseEntity<JobDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(jobService.getById(id));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('RECRUITER') or hasRole('ADMIN')")
    @Operation(summary = "Get recruiter's own jobs")
    public ResponseEntity<Page<JobDTO>> getMyJobs(
        @AuthenticationPrincipal User currentUser,
        Pageable pageable
    ) {
        return ResponseEntity.ok(jobService.getByRecruiter(currentUser.getId(), pageable));
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
}
