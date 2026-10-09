package com.nexhire.api.modules.admin.dto;

import java.util.List;

/** Settings every visitor needs: the banner and the pick-lists used in forms and filters. */
public record PublicSettingsDTO(
    Announcement announcement,
    List<String> categories,
    List<String> skills,
    /** Built-in video rooms are available for video interviews. */
    boolean videoEnabled
) {}
