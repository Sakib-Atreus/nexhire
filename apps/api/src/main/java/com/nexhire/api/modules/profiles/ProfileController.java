package com.nexhire.api.modules.profiles;

import com.nexhire.api.modules.profiles.dto.CandidateProfileDTO;
import com.nexhire.api.modules.profiles.dto.EducationDTO;
import com.nexhire.api.modules.profiles.dto.ExperienceDTO;
import com.nexhire.api.modules.users.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Profiles", description = "Work experience, education and public profiles")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/users/me/experience")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ExperienceDTO>> myExperience(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(profileService.experience(user.getId()));
    }

    @PutMapping("/users/me/experience")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Replace your work experience (ordered list, max 30)")
    public ResponseEntity<List<ExperienceDTO>> saveExperience(@Valid @RequestBody List<@Valid ExperienceDTO> items, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(profileService.replaceExperience(user.getId(), items));
    }

    @GetMapping("/users/me/education")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<EducationDTO>> myEducation(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(profileService.education(user.getId()));
    }

    @PutMapping("/users/me/education")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Replace your education (ordered list, max 30)")
    public ResponseEntity<List<EducationDTO>> saveEducation(@Valid @RequestBody List<@Valid EducationDTO> items, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(profileService.replaceEducation(user.getId(), items));
    }

    @GetMapping("/profiles/{slug}")
    @Operation(summary = "Public candidate profile (only if the candidate made it public)")
    public ResponseEntity<CandidateProfileDTO> publicProfile(@PathVariable String slug) {
        return ResponseEntity.ok(profileService.publicProfile(slug));
    }

    @GetMapping("/applications/{id}/candidate-profile")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Applicant's full profile, for the hiring team")
    public ResponseEntity<CandidateProfileDTO> applicantProfile(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(profileService.applicantProfile(id, user));
    }
}
