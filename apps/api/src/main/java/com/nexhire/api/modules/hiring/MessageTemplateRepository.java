package com.nexhire.api.modules.hiring;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageTemplateRepository extends JpaRepository<MessageTemplate, UUID> {

    List<MessageTemplate> findByOwnerIdOrderByNameAsc(UUID ownerId);

    long countByOwnerId(UUID ownerId);
}
