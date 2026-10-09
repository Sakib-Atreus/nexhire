package com.nexhire.api.modules.users;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByProfileSlug(String profileSlug);

    Optional<User> findByProfileSlugAndPublicProfileTrueAndEnabledTrue(String profileSlug);

    Page<User> findByRole(Role role, Pageable pageable);

    boolean existsByRole(Role role);

    long countByRole(Role role);

    long countByCompanyId(UUID companyId);

    List<User> findByCompanyIdOrderByCreatedAtAsc(UUID companyId);

    long countByEnabledFalse();

    long countByRoleAndVerifiedFalse(Role role);

    long countByCreatedAtAfter(Instant since);

    /** [yyyy-MM-dd, count] rows for sign-ups since the given time (days without sign-ups are absent). */
    @Query(value = """
        SELECT to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(*) AS total
        FROM users WHERE created_at >= :since GROUP BY day ORDER BY day
        """, nativeQuery = true)
    List<Object[]> countSignupsPerDay(@Param("since") Instant since);
}
