package com.nexhire.api.modules.alerts;

import java.util.UUID;

/** RabbitMQ message: a job became visible and open (published, reopened or un-hidden). */
public record JobPublishedMessage(UUID jobId) {}
