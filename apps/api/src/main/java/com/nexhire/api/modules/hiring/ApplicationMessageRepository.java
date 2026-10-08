package com.nexhire.api.modules.hiring;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApplicationMessageRepository extends JpaRepository<ApplicationMessage, UUID> {

    List<ApplicationMessage> findByApplicationIdOrderByCreatedAtAsc(UUID applicationId);

    long countByApplicationId(UUID applicationId);
}
