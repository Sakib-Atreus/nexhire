package com.nexhire.api.profiles;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.modules.applications.ApplicationService;
import com.nexhire.api.modules.profiles.EducationRepository;
import com.nexhire.api.modules.profiles.ProfileService;
import com.nexhire.api.modules.profiles.WorkExperienceRepository;
import com.nexhire.api.modules.profiles.dto.ExperienceDTO;
import com.nexhire.api.modules.users.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock private WorkExperienceRepository experienceRepository;
    @Mock private EducationRepository educationRepository;
    @Mock private UserRepository userRepository;
    @Mock private ApplicationService applicationService;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();
    @InjectMocks private ProfileService profileService;

    @Test
    void experienceEndingBeforeItStarts_isRejected() {
        ExperienceDTO bad = new ExperienceDTO(null, "Engineer", "Acme", null,
            LocalDate.of(2024, 5, 1), LocalDate.of(2023, 1, 1), null);

        assertThatThrownBy(() -> profileService.replaceExperience(UUID.randomUUID(), List.of(bad)))
            .isInstanceOf(BadRequestException.class);
        verify(experienceRepository, never()).saveAll(any());
    }
}
