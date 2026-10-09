package com.nexhire.api.modules.hiring;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApplicationNoteRepository extends JpaRepository<ApplicationNote, UUID> {

    List<ApplicationNote> findByApplicationIdOrderByCreatedAtAsc(UUID applicationId);

    long countByApplicationId(UUID applicationId);

    /** [applicationId, count] for a page of applications in one query. */
    @org.springframework.data.jpa.repository.Query("SELECT x.applicationId, COUNT(x) FROM ApplicationNote x WHERE x.applicationId IN :ids GROUP BY x.applicationId")
    java.util.List<Object[]> countByApplicationIds(@org.springframework.data.repository.query.Param("ids") java.util.Collection<UUID> ids);
}
