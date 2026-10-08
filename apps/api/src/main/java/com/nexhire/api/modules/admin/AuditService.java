package com.nexhire.api.modules.admin;

import com.nexhire.api.modules.admin.dto.AuditLogDTO;
import com.nexhire.api.modules.users.User;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    public static final String TARGET_USER = "USER";
    public static final String TARGET_JOB = "JOB";
    public static final String TARGET_REPORT = "REPORT";
    public static final String TARGET_SETTINGS = "SETTINGS";
    public static final String TARGET_COMPANY = "COMPANY";

    private final AuditLogRepository auditLogRepository;

    /** Records an admin action. Joins the caller's transaction so the entry commits (or rolls back) with the change. */
    @Transactional(propagation = Propagation.REQUIRED)
    public void record(User actor, AuditAction action, String targetType, UUID targetId, String targetLabel, String details) {
        auditLogRepository.save(AuditLog.builder()
            .actorId(actor != null ? actor.getId() : null)
            .actorEmail(actor != null ? actor.getEmail() : null)
            .actorName(actor != null ? actor.getFullName() : "System")
            .action(action)
            .targetType(targetType)
            .targetId(targetId)
            .targetLabel(truncate(targetLabel, 255))
            .details(details)
            .build());
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDTO> search(AuditAction action, String targetType, UUID targetId, String actor, Pageable pageable) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (action != null) p.add(cb.equal(root.get("action"), action));
            if (targetType != null && !targetType.isBlank()) p.add(cb.equal(root.get("targetType"), targetType));
            if (targetId != null) p.add(cb.equal(root.get("targetId"), targetId));
            if (actor != null && !actor.isBlank()) {
                String like = "%" + actor.trim().toLowerCase() + "%";
                p.add(cb.or(cb.like(cb.lower(root.get("actorEmail")), like), cb.like(cb.lower(root.get("actorName")), like)));
            }
            return cb.and(p.toArray(Predicate[]::new));
        };
        Pageable sorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
        return auditLogRepository.findAll(spec, sorted).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> recentForTarget(String targetType, UUID targetId) {
        return auditLogRepository.findTop10ByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId)
            .stream().map(this::toDTO).toList();
    }

    public AuditLogDTO toDTO(AuditLog log) {
        return new AuditLogDTO(log.getId(), log.getActorId(), log.getActorName(), log.getActorEmail(), log.getAction(),
            log.getTargetType(), log.getTargetId(), log.getTargetLabel(), log.getDetails(), log.getCreatedAt());
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
