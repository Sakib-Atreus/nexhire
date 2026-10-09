package com.nexhire.api.modules.alerts;

import com.nexhire.api.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

/**
 * Announces that a job became open and visible. Sent through RabbitMQ after the surrounding transaction
 * commits (so the consumer sees the job); if the broker is unavailable, alerts are matched directly.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JobPublishedPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectProvider<JobAlertService> alertService;

    public void jobPublished(UUID jobId) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send(jobId);
                }
            });
        } else {
            send(jobId);
        }
    }

    private void send(UUID jobId) {
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.NOTIFICATION_EXCHANGE, RabbitMQConfig.JOB_PUBLISHED_ROUTING_KEY,
                new JobPublishedMessage(jobId));
        } catch (AmqpException e) {
            log.warn("RabbitMQ unavailable ({}); matching job alerts directly", e.getMessage());
            try {
                alertService.getObject().processJobPublished(jobId);
            } catch (Exception ex) {
                log.warn("Job alert matching failed for job {}: {}", jobId, ex.getMessage());
            }
        }
    }
}
