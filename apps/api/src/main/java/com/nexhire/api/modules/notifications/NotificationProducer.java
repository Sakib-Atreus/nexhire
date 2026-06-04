package com.nexhire.api.modules.notifications;

import com.nexhire.api.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationProducer {

    private final RabbitTemplate rabbitTemplate;

    public void send(NotificationMessage message) {
        log.debug("Sending notification: type={}, userId={}", message.getType(), message.getUserId());
        rabbitTemplate.convertAndSend(
            RabbitMQConfig.NOTIFICATION_EXCHANGE,
            RabbitMQConfig.NOTIFICATION_ROUTING_KEY,
            message
        );
    }
}
