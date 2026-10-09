package com.nexhire.api.modules.alerts;

import com.nexhire.api.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JobPublishedConsumer {

    private final JobAlertService alertService;

    @RabbitListener(queues = RabbitMQConfig.JOB_ALERT_QUEUE)
    public void onJobPublished(JobPublishedMessage message) {
        alertService.processJobPublished(message.jobId());
    }
}
