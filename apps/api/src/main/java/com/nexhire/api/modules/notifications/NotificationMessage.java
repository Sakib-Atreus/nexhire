package com.nexhire.api.modules.notifications;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage {
    private UUID userId;
    private NotificationType type;
    private String title;
    private String message;
    private UUID referenceId;
    private String referenceType;
}
