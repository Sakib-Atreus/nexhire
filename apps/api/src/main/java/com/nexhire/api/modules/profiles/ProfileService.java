package com.nexhire.api.modules.profiles;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.exception.ResourceNotFoundException;
import com.nexhire.api.modules.applications.Application;
import com.nexhire.api.modules.applications.ApplicationService;
import com.nexhire.api.modules.profiles.dto.CandidateProfileDTO;
import com.nexhire.api.modules.profiles.dto.EducationDTO;
import com.nexhire.api.modules.profiles.dto.ExperienceDTO;
import com.nexhire.api.modules.users.User;
import com.nexhire.api.modules.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileService {

    private static final int MAX_ITEMS = 30;

    private final WorkExperienceRepository experienceRepository;
    private final EducationRepository educationRepository;
    private final UserRepository userRepository;
    private final ApplicationService applicationService;
    private final ObjectMapper objectMapper;

    public List<ExperienceDTO> experience(UUID userId) {
        return experienceRepository.findByUserIdOrderByPositionAsc(userId).stream().map(this::toDTO).toList();
    }

    public List<EducationDTO> education(UUID userId) {
        return educationRepository.findByUserIdOrderByPositionAsc(userId).stream().map(this::toDTO).toList();
    }

    /** Replace the whole experience list (order is kept). */
    @Transactional
    public List<ExperienceDTO> replaceExperience(UUID userId, List<ExperienceDTO> items) {
        if (items.size() > MAX_ITEMS) throw new BadRequestException("You can add up to " + MAX_ITEMS + " roles");
        List<WorkExperience> rows = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            ExperienceDTO e = items.get(i);
            if (e.endDate() != null && e.endDate().isBefore(e.startDate())) {
                throw new BadRequestException("End date can't be before the start date (" + e.title() + ")");
            }
            rows.add(WorkExperience.builder().userId(userId).title(e.title().trim()).company(e.company().trim())
                .location(blank(e.location())).startDate(e.startDate()).endDate(e.endDate())
                .description(blank(e.description())).position(i).build());
        }
        experienceRepository.deleteByUserId(userId);
        experienceRepository.flush();
        return experienceRepository.saveAll(rows).stream().map(this::toDTO).toList();
    }

    @Transactional
    public List<EducationDTO> replaceEducation(UUID userId, List<EducationDTO> items) {
        if (items.size() > MAX_ITEMS) throw new BadRequestException("You can add up to " + MAX_ITEMS + " entries");
        List<Education> rows = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            EducationDTO e = items.get(i);
            if (e.startYear() != null && e.endYear() != null && e.endYear() < e.startYear()) {
                throw new BadRequestException("End year can't be before the start year (" + e.school() + ")");
            }
            rows.add(Education.builder().userId(userId).school(e.school().trim()).degree(blank(e.degree()))
                .fieldOfStudy(blank(e.fieldOfStudy())).startYear(e.startYear()).endYear(e.endYear())
                .description(blank(e.description())).position(i).build());
        }
        educationRepository.deleteByUserId(userId);
        educationRepository.flush();
        return educationRepository.saveAll(rows).stream().map(this::toDTO).toList();
    }

    /** Public profile (only when the candidate opted in); no contact details or resume. */
    public CandidateProfileDTO publicProfile(String slug) {
        User user = userRepository.findByProfileSlugAndPublicProfileTrueAndEnabledTrue(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Profile", "slug", slug));
        return toProfile(user, false);
    }

    /** Full profile of an applicant, for the hiring team of that application. */
    public CandidateProfileDTO applicantProfile(UUID applicationId, User viewer) {
        Application app = applicationService.getManaged(applicationId, viewer);
        return toProfile(app.getCandidate(), true);
    }

    private CandidateProfileDTO toProfile(User u, boolean hiringTeam) {
        return new CandidateProfileDTO(u.getId(), u.getFullName(), u.getHeadline(), u.getLocation(), u.getBio(),
            u.getAvatarUrl(), list(u.getSkills()), list(u.getPortfolioLinks()), u.isOpenToWork(),
            experience(u.getId()), education(u.getId()), u.getCreatedAt(),
            hiringTeam ? u.getEmail() : null, hiringTeam ? u.getPhone() : null, hiringTeam ? u.getResumeUrl() : null,
            u.isPublicProfile() ? u.getProfileSlug() : null);
    }

    private List<String> list(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private ExperienceDTO toDTO(WorkExperience e) {
        return new ExperienceDTO(e.getId(), e.getTitle(), e.getCompany(), e.getLocation(), e.getStartDate(), e.getEndDate(), e.getDescription());
    }

    private EducationDTO toDTO(Education e) {
        return new EducationDTO(e.getId(), e.getSchool(), e.getDegree(), e.getFieldOfStudy(), e.getStartYear(), e.getEndYear(), e.getDescription());
    }

    private static String blank(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
