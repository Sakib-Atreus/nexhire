package com.nexhire.api.modules.notifications;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    long countByUserIdAndReadFalse(UUID userId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId AND n.read = false")
    void markAllReadByUserId(UUID userId);

    /** Housekeeping: read notifications older than the cutoff. */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.read = true AND n.createdAt < :before")
    int deleteReadBefore(@org.springframework.data.repository.query.Param("before") java.time.Instant before);
}
