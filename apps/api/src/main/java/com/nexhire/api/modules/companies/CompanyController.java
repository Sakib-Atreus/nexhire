package com.nexhire.api.modules.companies;

import com.nexhire.api.modules.companies.dto.*;
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
@RequiredArgsConstructor
@Tag(name = "Companies", description = "Company profiles and recruiter teams")
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping("/companies")
    @Operation(summary = "Company directory (public)")
    public ResponseEntity<Page<CompanyDTO>> list(@RequestParam(required = false) String q, Pageable pageable) {
        return ResponseEntity.ok(companyService.search(q, null, pageable));
    }

    @GetMapping("/companies/sizes")
    @Operation(summary = "Allowed company size bands")
    public ResponseEntity<List<String>> sizes() {
        return ResponseEntity.ok(CompanySizes.ALL);
    }

    @GetMapping("/companies/{slug}")
    @Operation(summary = "Public company profile with open jobs")
    public ResponseEntity<CompanyProfileDTO> profile(@PathVariable String slug) {
        return ResponseEntity.ok(companyService.profile(slug));
    }

    @GetMapping("/company")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "The signed-in recruiter's company and team (204 if none)")
    public ResponseEntity<MyCompanyDTO> mine(@AuthenticationPrincipal User user) {
        return companyService.mine(user).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/company")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Create a company; the creator becomes its owner")
    public ResponseEntity<MyCompanyDTO> create(@Valid @RequestBody CompanyRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(companyService.create(request, user));
    }

    @PutMapping("/company")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Update the company profile (any team member)")
    public ResponseEntity<MyCompanyDTO> update(@Valid @RequestBody CompanyRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(companyService.update(request, user));
    }

    @PostMapping("/company/members")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Add a recruiter to the team by email (owner only)")
    public ResponseEntity<MyCompanyDTO> addMember(@Valid @RequestBody AddMemberRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(companyService.addMember(request.email(), user));
    }

    @DeleteMapping("/company/members/{memberId}")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Remove a recruiter from the team (owner only)")
    public ResponseEntity<MyCompanyDTO> removeMember(@PathVariable UUID memberId, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(companyService.removeMember(memberId, user));
    }

    @PostMapping("/company/owner/{memberId}")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Make another team member the owner (owner only)")
    public ResponseEntity<MyCompanyDTO> transfer(@PathVariable UUID memberId, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(companyService.transferOwnership(memberId, user));
    }

    @PostMapping("/company/leave")
    @PreAuthorize("hasRole('RECRUITER')")
    @Operation(summary = "Leave the company (not available to the owner)")
    public ResponseEntity<Void> leave(@AuthenticationPrincipal User user) {
        companyService.leave(user);
        return ResponseEntity.noContent().build();
    }
}
