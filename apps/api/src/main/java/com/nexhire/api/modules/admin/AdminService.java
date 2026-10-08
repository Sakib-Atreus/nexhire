package com.nexhire.api.modules.admin;

import com.nexhire.api.exception.ResourceNotFoundException;
import com.nexhire.api.modules.admin.dto.AdminOverviewDTO;
import com.nexhire.api.modules.admin.dto.AdminOverviewDTO.CompanyStat;
import com.nexhire.api.modules.admin.dto.AdminOverviewDTO.DailyCount;
import com.nexhire.api.modules.admin.dto.AdminUserDetailDTO;
import com.nexhire.api.modules.applications.ApplicationRepository;
import com.nexhire.api.modules.applications.ApplicationService;
import com.nexhire.api.modules.jobs.JobRepository;
import com.nexhire.api.modules.jobs.JobService;
import com.nexhire.api.modules.jobs.JobStatus;
import com.nexhire.api.modules.users.Role;
import com.nexhire.api.modules.users.User;
import com.nexhire.api.modules.users.UserRepository;
import com.nexhire.api.modules.users.UserService;
import com.nexhire.api.modules.users.dto.UserDTO;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private static final int SERIES_DAYS = 30;

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final JobReportRepository reportRepository;
    private final UserService userService;
    private final JobService jobService;
    private final ApplicationService applicationService;
    private final AuditService auditService;

    public AdminOverviewDTO overview() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate firstDay = today.minusDays(SERIES_DAYS - 1L);
        Instant since = firstDay.atStartOfDay(ZoneOffset.UTC).toInstant();

        List<CompanyStat> companies = jobRepository.topCompanies(5).stream()
            .map(r -> new CompanyStat((String) r[0], toLong(r[1]), toLong(r[2])))
            .toList();

        return new AdminOverviewDTO(
            userRepository.count(),
            userRepository.countByRole(Role.CANDIDATE),
            userRepository.countByRole(Role.RECRUITER),
            userRepository.countByRole(Role.ADMIN),
            userRepository.countByEnabledFalse(),
            userRepository.countByRoleAndVerifiedFalse(Role.RECRUITER),
            userRepository.countByCreatedAtAfter(since),
            jobRepository.count(),
            jobRepository.countByStatus(JobStatus.OPEN),
            jobRepository.countByHiddenTrue(),
            jobRepository.countByFeaturedTrue(),
            applicationRepository.count(),
            applicationRepository.countByAppliedAtAfter(since),
            reportRepository.countByStatus(ReportStatus.OPEN),
            fillDays(userRepository.countSignupsPerDay(since), firstDay),
            fillDays(applicationRepository.countApplicationsPerDay(since), firstDay),
            companies
        );
    }

    /** Server-side user search: q matches name or email; status is "active" or "suspended". */
    public Page<UserDTO> searchUsers(String q, Role role, String status, Boolean verified, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase() + "%";
                p.add(cb.or(
                    cb.like(cb.lower(root.get("email")), like),
                    cb.like(cb.lower(root.get("firstName")), like),
                    cb.like(cb.lower(root.get("lastName")), like),
                    cb.like(cb.lower(cb.concat(cb.concat(root.get("firstName"), " "), root.get("lastName"))), like)));
            }
            if (role != null) p.add(cb.equal(root.get("role"), role));
            if ("active".equalsIgnoreCase(status)) p.add(cb.isTrue(root.get("enabled")));
            if ("suspended".equalsIgnoreCase(status)) p.add(cb.isFalse(root.get("enabled")));
            if (verified != null) {
                // Verification only applies to recruiters, so this filter implies role = RECRUITER.
                p.add(cb.equal(root.get("verified"), verified));
                if (role == null) p.add(cb.equal(root.get("role"), Role.RECRUITER));
            }
            return cb.and(p.toArray(Predicate[]::new));
        };
        Pageable sorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
        return userRepository.findAll(spec, sorted).map(userService::toDTO);
    }

    public AdminUserDetailDTO userDetail(UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        boolean recruiter = user.getRole() == Role.RECRUITER;
        boolean candidate = user.getRole() == Role.CANDIDATE;
        return new AdminUserDetailDTO(
            userService.toDTO(user),
            recruiter ? jobService.countByRecruiter(id) : 0,
            candidate ? applicationService.countByCandidate(id) : 0,
            reportRepository.countByReporterId(id),
            recruiter ? jobService.recentByRecruiter(id) : List.of(),
            candidate ? applicationService.recentByCandidate(id) : List.of(),
            auditService.recentForTarget(AuditService.TARGET_USER, id)
        );
    }

    private static List<DailyCount> fillDays(List<Object[]> rows, LocalDate firstDay) {
        Map<String, Long> byDay = new HashMap<>();
        for (Object[] r : rows) byDay.put((String) r[0], toLong(r[1]));
        List<DailyCount> series = new ArrayList<>(SERIES_DAYS);
        for (int i = 0; i < SERIES_DAYS; i++) {
            String day = firstDay.plus(i, ChronoUnit.DAYS).toString();
            series.add(new DailyCount(day, byDay.getOrDefault(day, 0L)));
        }
        return series;
    }

    private static long toLong(Object o) {
        return o == null ? 0L : ((Number) o).longValue();
    }
}
