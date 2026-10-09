package com.nexhire.api.modules.calendar;

import com.nexhire.api.modules.hiring.HiringService;
import com.nexhire.api.modules.hiring.dto.InterviewDTO;
import com.nexhire.api.modules.users.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Calendar", description = "Interview calendar and personal calendar feed")
public class CalendarController {

    private final HiringService hiringService;
    private final CalendarFeedService feedService;

    @GetMapping("/interviews/calendar")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Interviews (any status) starting between from and to (ISO instants, max 100 days)")
    public ResponseEntity<List<InterviewDTO>> calendar(@RequestParam Instant from, @RequestParam Instant to, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(hiringService.calendar(user, from, to));
    }

    @GetMapping("/calendar/feed")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Your private calendar feed URL (created on first request)")
    public ResponseEntity<Map<String, String>> feedUrl(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("url", feedUrl(feedService.token(user))));
    }

    @PostMapping("/calendar/feed/reset")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Replace your calendar feed URL (the old one stops working)")
    public ResponseEntity<Map<String, String>> resetFeed(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("url", feedUrl(feedService.reset(user))));
    }

    @GetMapping(value = "/calendar/feed/{token}.ics", produces = "text/calendar")
    @Operation(summary = "iCalendar feed (public; the token is the secret)")
    public ResponseEntity<String> feed(@PathVariable String token) {
        return ResponseEntity.ok()
            .contentType(new MediaType("text", "calendar", java.nio.charset.StandardCharsets.UTF_8))
            .header(HttpHeaders.CACHE_CONTROL, "private, max-age=300")
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"nexhire-interviews.ics\"")
            .body(feedService.feed(token));
    }

    /** Absolute URL of the feed on this API (honours X-Forwarded-* behind Render's proxy). */
    private static String feedUrl(String token) {
        return ServletUriComponentsBuilder.fromCurrentContextPath().path("/calendar/feed/{token}.ics").buildAndExpand(token).toUriString();
    }
}
