package com.nexhire.api.modules.notifications;

import com.nexhire.api.config.RabbitMQConfig;
import com.nexhire.api.modules.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    @Transactional
    public void consume(NotificationMessage message) {
        log.debug("Processing notification: type={}, userId={}", message.getType(), message.getUserId());

        userRepository.findById(message.getUserId()).ifPresent(user -> {
            Notification notification = Notification.builder()
                .user(user)
                .type(message.getType())
                .title(message.getTitle())
                .message(message.getMessage())
                .referenceId(message.getReferenceId())
                .referenceType(message.getReferenceType())
                .build();

            notificationRepository.save(notification);
        });
    }
}
