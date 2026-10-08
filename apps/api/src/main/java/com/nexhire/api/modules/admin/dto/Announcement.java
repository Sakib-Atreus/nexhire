package com.nexhire.api.modules.admin.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Site-wide banner. tone: info | success | warning. */
public record Announcement(
    boolean enabled,
    @Size(max = 300, message = "Keep the announcement under 300 characters") String message,
    @Pattern(regexp = "info|success|warning", message = "Tone must be info, success or warning") String tone,
    @Size(max = 500) String linkUrl,
    @Size(max = 40) String linkLabel
) {
    public static Announcement disabled() {
        return new Announcement(false, "", "info", "", "");
    }
}
