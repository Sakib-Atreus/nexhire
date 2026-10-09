package com.nexhire.api.modules.profiles;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkExperienceRepository extends JpaRepository<WorkExperience, UUID> {

    List<WorkExperience> findByUserIdOrderByPositionAsc(UUID userId);

    @Modifying
    void deleteByUserId(UUID userId);
}
