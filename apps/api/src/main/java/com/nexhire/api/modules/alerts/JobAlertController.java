package com.nexhire.api.modules.alerts;

import com.nexhire.api.modules.alerts.dto.JobAlertDTO;
import com.nexhire.api.modules.alerts.dto.JobAlertRequest;
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

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/job-alerts")
@RequiredArgsConstructor
@Tag(name = "Job alerts", description = "Saved searches that notify candidates about new jobs")
public class JobAlertController {

    private final JobAlertService alertService;

    @GetMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<List<JobAlertDTO>> mine(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(alertService.mine(user));
    }

    @PostMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Save a search as a job alert (max 10; INSTANT or DAILY)")
    public ResponseEntity<JobAlertDTO> create(@Valid @RequestBody JobAlertRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(alertService.create(request, user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<JobAlertDTO> update(@PathVariable UUID id, @Valid @RequestBody JobAlertRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(alertService.update(id, request, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        alertService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/unsubscribe")
    @Operation(summary = "One-click unsubscribe from an alert email (no login)")
    public ResponseEntity<Map<String, String>> unsubscribe(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(Map.of("name", alertService.unsubscribe(body.get("token"))));
    }
}
