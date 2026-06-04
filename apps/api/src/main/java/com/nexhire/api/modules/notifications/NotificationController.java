package com.nexhire.api.modules.notifications;

import com.nexhire.api.modules.notifications.dto.NotificationDTO;
import com.nexhire.api.modules.users.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notification endpoints")
public class NotificationController {

    private final NotificationService notificationService;

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
}
