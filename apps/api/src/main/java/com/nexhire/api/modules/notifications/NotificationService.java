package com.nexhire.api.modules.notifications;

import com.nexhire.api.exception.ResourceNotFoundException;
import com.nexhire.api.modules.applications.Application;
import com.nexhire.api.modules.jobs.Job;
import com.nexhire.api.modules.notifications.dto.NotificationDTO;
import com.nexhire.api.modules.users.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationProducer notificationProducer;
    private final SseEmitterService sseEmitterService;
    /** Own proxy, so calls to {@link #notify} from this class still run asynchronously. */
    @org.springframework.beans.factory.annotation.Autowired @org.springframework.context.annotation.Lazy
    private NotificationService self;

    public Page<NotificationDTO> getForUser(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(this::toDTO);
    }

    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    @Transactional
    public void markRead(UUID notificationId, User currentUser) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getUser().getId().equals(currentUser.getId())) {
            throw new com.nexhire.api.exception.ForbiddenException("Not your notification");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    /** Nightly: delete read notifications older than 90 days so the table doesn't grow forever. */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 30 3 * * *", zone = "UTC")
    @Transactional
    public void deleteOldReadNotifications() {
        int deleted = notificationRepository.deleteReadBefore(java.time.Instant.now().minus(90, java.time.temporal.ChronoUnit.DAYS));
        if (deleted > 0) org.slf4j.LoggerFactory.getLogger(NotificationService.class).info("Deleted {} old read notifications", deleted);
    }

    /** Send a notification built from plain values (safe to call with data read inside a transaction). */
    @Async
    public void notify(UUID userId, NotificationType type, String title, String message, UUID referenceId, String referenceType) {
        notificationProducer.send(new NotificationMessage(userId, type, title, message, referenceId, referenceType));
    }

    /**
     * Values are read here, on the caller's thread and inside its transaction (lazy job/candidate
     * associations can't be loaded from the async thread); only the send happens asynchronously.
     */
    public void notifyApplicationReceived(Application application) {
        self.notify(
            application.getJob().getRecruiter().getId(),
            NotificationType.APPLICATION_RECEIVED,
            "New Application Received",
            String.format("%s applied for '%s'", application.getCandidate().getFullName(), application.getJob().getTitle()),
            application.getId(),
            "APPLICATION");
    }

    @Async
    @Transactional
    public void notifyJobExpired(Job job) {
        Notification notification = Notification.builder()
            .user(job.getRecruiter())
            .type(NotificationType.JOB_CLOSED)
            .title("Job Listing Closed")
            .message(String.format("Your job listing '%s' has been automatically closed because the deadline has passed.",
                job.getTitle()))
            .referenceId(job.getId())
            .referenceType("JOB")
            .build();
        createAndPush(notification);
    }

    /** See {@link #notifyApplicationReceived}: values are read on the caller's thread. */
    public void notifyApplicationStatusChanged(Application application) {
        self.notify(
            application.getCandidate().getId(),
            NotificationType.APPLICATION_STATUS_CHANGED,
            "Application Status Updated",
            String.format("Your application for '%s' is now %s", application.getJob().getTitle(), application.getStatus().name()),
            application.getId(),
            "APPLICATION");
    }

    /**
     * Persists a notification directly (bypassing RabbitMQ) and pushes it
     * to any active SSE connections for the recipient immediately.
     */
    @Transactional
    public NotificationDTO createAndPush(Notification notification) {
        Notification saved = notificationRepository.save(notification);
        NotificationDTO dto = toDTO(saved);
        sseEmitterService.sendToUser(saved.getUser().getId(), dto);
        return dto;
    }

    public NotificationDTO toDTO(Notification notification) {
        return new NotificationDTO(
            notification.getId(),
            notification.getType(),
            notification.getTitle(),
            notification.getMessage(),
            notification.isRead(),
            notification.getReferenceId(),
            notification.getReferenceType(),
            notification.getCreatedAt()
        );
    }
}
