package com.nexhire.api.modules.companies;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyRepository extends JpaRepository<Company, UUID> {

    Optional<Company> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsByNameIgnoreCase(String name);

    @Query("""
        SELECT c FROM Company c
        WHERE (CAST(:q AS String) IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', CAST(:q AS String), '%'))
               OR LOWER(c.industry) LIKE LOWER(CONCAT('%', CAST(:q AS String), '%')))
        AND (:verified IS NULL OR c.verified = :verified)
        """)
    Page<Company> search(@Param("q") String q, @Param("verified") Boolean verified, Pageable pageable);
}
