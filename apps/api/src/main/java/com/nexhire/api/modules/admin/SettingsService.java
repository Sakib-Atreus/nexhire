package com.nexhire.api.modules.admin;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.modules.admin.dto.Announcement;
import com.nexhire.api.modules.admin.dto.PublicSettingsDTO;
import com.nexhire.api.modules.users.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettingsService {

    public static final String ANNOUNCEMENT = "announcement";
    public static final String CATEGORIES = "categories";
    public static final String SKILLS = "skills";

    private static final int MAX_CATEGORIES = 50;
    private static final int MAX_SKILLS = 300;
    private static final int MAX_ITEM_LENGTH = 50;

    private final SiteSettingRepository repository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final com.nexhire.api.modules.video.VideoService videoService;

    public PublicSettingsDTO getPublic() {
        return new PublicSettingsDTO(getAnnouncement(), getList(CATEGORIES), getList(SKILLS), videoService.isEnabled());
    }

    public Announcement getAnnouncement() {
        return repository.findById(ANNOUNCEMENT).map(s -> {
            try {
                return objectMapper.readValue(s.getValue(), Announcement.class);
            } catch (Exception e) {
                log.warn("Invalid announcement setting JSON; treating as disabled");
                return Announcement.disabled();
            }
        }).orElse(Announcement.disabled());
    }

    public List<String> getList(String key) {
        return repository.findById(key).map(s -> {
            try {
                return objectMapper.readValue(s.getValue(), new TypeReference<List<String>>() {});
            } catch (Exception e) {
                log.warn("Invalid '{}' setting JSON; returning empty list", key);
                return Collections.<String>emptyList();
            }
        }).orElse(Collections.emptyList());
    }

    @Transactional
    public Announcement updateAnnouncement(Announcement a, User admin) {
        String message = a.message() == null ? "" : a.message().trim();
        if (a.enabled() && message.isEmpty()) {
            throw new BadRequestException("Write a message before turning the announcement on");
        }
        String link = a.linkUrl() == null ? "" : a.linkUrl().trim();
        if (!link.isEmpty() && !(link.startsWith("https://") || link.startsWith("/"))) {
            throw new BadRequestException("Links must start with https:// or /");
        }
        Announcement clean = new Announcement(a.enabled(), message, a.tone() == null ? "info" : a.tone(), link,
            a.linkLabel() == null ? "" : a.linkLabel().trim());
        save(ANNOUNCEMENT, clean, admin);
        auditService.record(admin, AuditAction.SETTINGS_UPDATED, AuditService.TARGET_SETTINGS, null, "Announcement",
            clean.enabled() ? "Shown: " + clean.message() : "Turned off");
        return clean;
    }

    @Transactional
    public List<String> updateList(String key, List<String> items, User admin) {
        int max = CATEGORIES.equals(key) ? MAX_CATEGORIES : MAX_SKILLS;
        Set<String> unique = new LinkedHashSet<>();
        for (String raw : items == null ? List.<String>of() : items) {
            if (raw == null) continue;
            String item = raw.trim().replaceAll("\\s+", " ");
            if (item.isEmpty()) continue;
            if (item.length() > MAX_ITEM_LENGTH) {
                throw new BadRequestException("Keep each item under " + MAX_ITEM_LENGTH + " characters: " + item);
            }
            if (unique.stream().noneMatch(u -> u.equalsIgnoreCase(item))) unique.add(item);
        }
        if (unique.size() > max) {
            throw new BadRequestException("You can have at most " + max + " items");
        }
        List<String> clean = List.copyOf(unique);
        save(key, clean, admin);
        auditService.record(admin, AuditAction.SETTINGS_UPDATED, AuditService.TARGET_SETTINGS, null,
            CATEGORIES.equals(key) ? "Job categories" : "Skills", clean.size() + " items");
        return clean;
    }

    private void save(String key, Object value, User admin) {
        try {
            SiteSetting setting = repository.findById(key).orElseGet(() -> SiteSetting.builder().key(key).build());
            setting.setValue(objectMapper.writeValueAsString(value));
            setting.setUpdatedBy(admin.getId());
            repository.save(setting);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("Could not serialize setting " + key, e);
        }
    }
}
