package com.nexhire.api.modules.notifications;

import com.nexhire.api.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationProducer {

    private final RabbitTemplate rabbitTemplate;
    // Lazy to avoid a cycle (consumer -> service -> producer).
    private final ObjectProvider<NotificationConsumer> consumer;

    public void send(NotificationMessage message) {
        log.debug("Sending notification: type={}, userId={}", message.getType(), message.getUserId());
        try {
            rabbitTemplate.convertAndSend(
                RabbitMQConfig.NOTIFICATION_EXCHANGE,
                RabbitMQConfig.NOTIFICATION_ROUTING_KEY,
                message
            );
        } catch (AmqpException e) {
            log.warn("RabbitMQ unavailable ({}); delivering notification directly", e.getMessage());
            consumer.getObject().consume(message);
        }
    }
}
