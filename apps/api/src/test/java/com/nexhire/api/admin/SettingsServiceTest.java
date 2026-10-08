package com.nexhire.api.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.modules.admin.AuditService;
import com.nexhire.api.modules.admin.SettingsService;
import com.nexhire.api.modules.admin.SiteSettingRepository;
import com.nexhire.api.modules.admin.dto.Announcement;
import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class SettingsServiceTest {

    @Mock private SiteSettingRepository repository;
    @Mock private AuditService auditService;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();
    @InjectMocks private SettingsService settingsService;

    private final User admin = User.builder().id(UUID.randomUUID()).email("a@test.com").firstName("A").lastName("B").role(Role.ADMIN).build();

    @Test
    void updateList_trimsDedupesAndDropsBlanks() {
        List<String> result = settingsService.updateList(SettingsService.CATEGORIES,
            Arrays.asList(" Engineering ", "engineering", "", null, "Data   Science"), admin);

        assertThat(result).containsExactly("Engineering", "Data Science");
    }

    @Test
    void updateList_rejectsTooManyCategories() {
        List<String> items = java.util.stream.IntStream.range(0, 51).mapToObj(i -> "Cat " + i).toList();

        assertThatThrownBy(() -> settingsService.updateList(SettingsService.CATEGORIES, items, admin))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    void announcement_rejectsUnsafeLinks() {
        assertThatThrownBy(() -> settingsService.updateAnnouncement(
            new Announcement(true, "Hello", "info", "javascript:alert(1)", "x"), admin))
            .isInstanceOf(BadRequestException.class);
    }

    @Test
    void announcement_requiresMessageWhenEnabled() {
        assertThatThrownBy(() -> settingsService.updateAnnouncement(new Announcement(true, "  ", "info", "", ""), admin))
            .isInstanceOf(BadRequestException.class);
    }
}
