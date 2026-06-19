package com.nexhire.api.modules.notifications;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexhire.api.exception.ForbiddenException;
import com.nexhire.api.exception.ResourceNotFoundException;
import com.nexhire.api.modules.notifications.dto.NotificationDTO;
import com.nexhire.api.modules.users.User;
import com.nexhire.api.modules.users.UserRepository;
import com.nexhire.api.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notification endpoints")
public class NotificationController {

    private final NotificationService notificationService;
    private final SseEmitterService sseEmitterService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @GetMapping
    @Operation(summary = "Get current user's notifications")
    public ResponseEntity<Page<NotificationDTO>> getNotifications(
        @AuthenticationPrincipal User currentUser,
        Pageable pageable
    ) {
        return ResponseEntity.ok(notificationService.getForUser(currentUser.getId(), pageable));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(currentUser.getId())));
    }

    @PatchMapping("/mark-all-read")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal User currentUser) {
        notificationService.markAllRead(currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<Void> markRead(
        @PathVariable UUID id,
        @AuthenticationPrincipal User currentUser
    ) {
        notificationService.markRead(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stream")
    @Operation(summary = "SSE stream for real-time notifications")
    public SseEmitter stream(
        @AuthenticationPrincipal User currentUser,
        @RequestParam(required = false) String token,
        HttpServletResponse response
    ) {
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("X-Accel-Buffering", "no");
        UUID userId;
        if (currentUser != null) {
            userId = currentUser.getId();
        } else if (token != null) {
            // Fallback for EventSource clients that cannot set Authorization headers
            String email = jwtTokenProvider.extractUsername(token);
            userId = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email))
                .getId();
        } else {
            throw new ForbiddenException("Authentication required for SSE stream");
        }
        return sseEmitterService.subscribe(userId);
    }

    @GetMapping("/preferences")
    @Operation(summary = "Get notification preferences")
    public ResponseEntity<Map<String, Object>> getPreferences(
        @AuthenticationPrincipal User currentUser
    ) {
        String prefs = currentUser.getNotificationPreferences();
        if (prefs == null) prefs = "{}";
        try {
            Map<String, Object> map = objectMapper.readValue(prefs, new TypeReference<>() {});
            return ResponseEntity.ok(map);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "applicationReceived", true,
                "statusChanged", true,
                "general", true
            ));
        }
    }

    @PatchMapping("/preferences")
    @Operation(summary = "Update notification preferences")
    public ResponseEntity<Map<String, Object>> updatePreferences(
        @AuthenticationPrincipal User currentUser,
        @RequestBody Map<String, Object> preferences
    ) {
        try {
            String json = objectMapper.writeValueAsString(preferences);
            currentUser.setNotificationPreferences(json);
            userRepository.save(currentUser);
            return ResponseEntity.ok(preferences);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update preferences", e);
        }
    }
}
