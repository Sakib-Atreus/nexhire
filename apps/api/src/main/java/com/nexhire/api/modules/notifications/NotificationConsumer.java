package com.nexhire.api.modules.notifications;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexhire.api.config.RabbitMQConfig;
import com.nexhire.api.modules.notifications.dto.NotificationDTO;
import com.nexhire.api.modules.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SseEmitterService sseEmitterService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    @Transactional
    public void consume(NotificationMessage message) {
        log.debug("Processing notification: type={}, userId={}", message.getType(), message.getUserId());

        userRepository.findById(message.getUserId()).ifPresent(user -> {
            // Check notification preferences before persisting.
            // Preferences are stored as JSON, e.g. {"applicationReceived":true,"statusChanged":false,"general":true}.
            // If a preference key is absent we default to true (opt-in by default).
            if (!isTypeAllowed(user.getNotificationPreferences(), message.getType())) {
                log.debug("Notification suppressed by user preferences: type={}, userId={}",
                    message.getType(), message.getUserId());
                return;
            }

            Notification notification = Notification.builder()
                .user(user)
                .type(message.getType())
                .title(message.getTitle())
                .message(message.getMessage())
                .referenceId(message.getReferenceId())
                .referenceType(message.getReferenceType())
                .build();

            Notification saved = notificationRepository.save(notification);

            // Push the saved notification to any active SSE connections for this user.
            NotificationDTO dto = notificationService.toDTO(saved);
            sseEmitterService.sendToUser(user.getId(), dto);
        });
    }

    /**
     * Returns true if the notification type is permitted by the user's stored preferences JSON.
     * Defaults to true when the preference key is missing or the JSON is unparseable.
     */
    private boolean isTypeAllowed(String preferencesJson, NotificationType type) {
        if (preferencesJson == null || preferencesJson.isBlank()) return true;
        try {
            Map<String, Object> prefs = objectMapper.readValue(
                preferencesJson, new TypeReference<>() {});
            String key = switch (type) {
                case APPLICATION_RECEIVED -> "applicationReceived";
                case APPLICATION_STATUS_CHANGED -> "statusChanged";
                case GENERAL -> "general";
                default -> null;
            };
            if (key == null) return true;
            Object val = prefs.get(key);
            if (val instanceof Boolean b) return b;
            return true; // absent key → allow
        } catch (Exception e) {
            log.warn("Could not parse notificationPreferences JSON, defaulting to allowed: {}", e.getMessage());
            return true;
        }
    }
}
