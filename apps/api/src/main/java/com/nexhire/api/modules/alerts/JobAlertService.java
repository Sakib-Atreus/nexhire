package com.nexhire.api.modules.alerts;

import com.nexhire.api.exception.BadRequestException;
import com.nexhire.api.exception.ResourceNotFoundException;
import com.nexhire.api.modules.alerts.dto.JobAlertDTO;
import com.nexhire.api.modules.alerts.dto.JobAlertRequest;
import com.nexhire.api.modules.jobs.Job;
import com.nexhire.api.modules.jobs.JobRepository;
import com.nexhire.api.modules.jobs.JobStatus;
import com.nexhire.api.modules.mail.MailService;
import com.nexhire.api.modules.notifications.NotificationService;
import com.nexhire.api.modules.notifications.NotificationType;
import com.nexhire.api.modules.users.User;
import com.nexhire.api.modules.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobAlertService {

    private static final int MAX_ALERTS = 10;
    private static final int MAX_JOBS_IN_DIGEST = 10;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final JobAlertRepository alertRepository;
    private final JobAlertMatchRepository matchRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final MailService mailService;
    private final org.springframework.transaction.support.TransactionTemplate transactionTemplate;
    private final jakarta.persistence.EntityManager entityManager;

    /** Alerts examined per batch when a job is published. */
    private static final int MATCH_BATCH = 500;
    /** Alerts handled per round of the daily digest (each alert in its own transaction). */
    private static final int DIGEST_BATCH = 200;

    // ─── CRUD (candidate) ───────────────────────────────────────────────────

    public List<JobAlertDTO> mine(User user) {
        return alertRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream().map(this::toDTO).toList();
    }

    @Transactional
    public JobAlertDTO create(JobAlertRequest request, User user) {
        if (alertRepository.countByUserId(user.getId()) >= MAX_ALERTS) {
            throw new BadRequestException("You can have up to " + MAX_ALERTS + " job alerts");
        }
        JobAlert alert = JobAlert.builder().userId(user.getId()).unsubscribeToken(newToken()).build();
        apply(alert, request);
        return toDTO(alertRepository.save(alert));
    }

    @Transactional
    public JobAlertDTO update(UUID id, JobAlertRequest request, User user) {
        JobAlert alert = own(id, user);
        apply(alert, request);
        return toDTO(alertRepository.save(alert));
    }

    @Transactional
    public void delete(UUID id, User user) {
        alertRepository.delete(own(id, user));
    }

    /** One-click unsubscribe from an alert email (no login). Returns the alert's name. */
    @Transactional
    public String unsubscribe(String token) {
        JobAlert alert = alertRepository.findByUnsubscribeToken(token == null ? "" : token.trim())
            .orElseThrow(() -> new BadRequestException("This unsubscribe link is invalid or the alert was deleted"));
        alert.setActive(false);
        alertRepository.save(alert);
        return alert.getName();
    }

    // ─── Matching (called when a job is published) ──────────────────────────

    /**
     * Match a newly visible job against every active alert. Instant alerts are delivered now;
     * daily alerts are queued for the digest. Runs in its own transaction (from the queue consumer).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processJobPublished(UUID jobId) {
        Optional<Job> found = jobRepository.findById(jobId);
        if (found.isEmpty()) return;
        Job job = found.get();
        if (job.getStatus() != JobStatus.OPEN || job.isHidden()) return;

        String haystack = haystack(job);
        int matched = 0;
        var page = org.springframework.data.domain.PageRequest.of(0, MATCH_BATCH);
        while (true) {
            var slice = alertRepository.candidatesFor(job.getCategory(), job.getJobType(), job.getExperienceLevel(), page);
            for (JobAlert alert : slice) {
                if (!matches(alert, job, haystack) || matchRepository.existsByAlertIdAndJobId(alert.getId(), jobId)) continue;
                matched++;
                JobAlertMatch match = matchRepository.save(JobAlertMatch.builder().alertId(alert.getId()).jobId(jobId).build());
                if (alert.getFrequency() == AlertFrequency.INSTANT) {
                    deliver(alert, List.of(job));
                    match.setSent(true);
                    matchRepository.save(match);
                }
            }
            if (!slice.hasNext()) break;
            // Keep memory flat: write this batch and drop it from the persistence context.
            entityManager.flush();
            entityManager.clear();
            page = page.next();
        }
        if (matched > 0) log.info("Job {} matched {} alert(s)", jobId, matched);
    }

    /**
     * Daily digest of queued matches (08:00 UTC). Each alert is handled in its own short transaction,
     * so memory and connection time stay small however many alerts are waiting.
     */
    @Scheduled(cron = "0 0 8 * * *", zone = "UTC")
    @Transactional(propagation = Propagation.NOT_SUPPORTED) // no outer transaction: one per alert below
    public void sendDailyDigests() {
        Set<UUID> done = new HashSet<>();
        while (true) {
            List<UUID> batch = matchRepository.pendingAlertIds(org.springframework.data.domain.PageRequest.of(0, DIGEST_BATCH));
            batch.removeIf(done::contains);
            if (batch.isEmpty()) break;
            for (UUID alertId : batch) {
                done.add(alertId);
                try {
                    transactionTemplate.executeWithoutResult(status -> sendDigest(alertId));
                } catch (RuntimeException e) {
                    log.warn("Daily digest for alert {} failed: {}", alertId, e.getMessage());
                }
            }
        }
    }

    private void sendDigest(UUID alertId) {
        alertRepository.findById(alertId).filter(JobAlert::isActive).ifPresent(alert -> {
            List<UUID> jobIds = matchRepository.findByAlertIdAndSentFalseOrderByCreatedAtAsc(alertId).stream()
                .map(JobAlertMatch::getJobId).toList();
            List<Job> jobs = jobRepository.findAllById(jobIds).stream()
                .filter(j -> j.getStatus() == JobStatus.OPEN && !j.isHidden()).toList();
            if (!jobs.isEmpty()) deliver(alert, jobs);
        });
        matchRepository.markSent(alertId);
    }

    /** Does this job satisfy every criterion the alert sets? */
    static boolean matches(JobAlert alert, Job job) {
        return matches(alert, job, haystack(job));
    }

    /** Lower-cased text the keyword is searched in; built once per job, not once per alert. */
    private static String haystack(Job job) {
        return String.join(" ",
            Objects.toString(job.getTitle(), ""), Objects.toString(job.getDescription(), ""),
            Objects.toString(job.getTags(), ""), Objects.toString(job.getCompanyName(), "")).toLowerCase(Locale.ROOT);
    }

    static boolean matches(JobAlert alert, Job job, String haystack) {
        if (notBlank(alert.getKeyword())) {
            if (!haystack.contains(alert.getKeyword().trim().toLowerCase(Locale.ROOT))) return false;
        }
        if (notBlank(alert.getLocation())
            && !Objects.toString(job.getLocation(), "").toLowerCase(Locale.ROOT).contains(alert.getLocation().trim().toLowerCase(Locale.ROOT))) {
            return false;
        }
        if (notBlank(alert.getCategory()) && !alert.getCategory().equalsIgnoreCase(Objects.toString(job.getCategory(), ""))) return false;
        if (alert.getJobType() != null && alert.getJobType() != job.getJobType()) return false;
        return alert.getExperienceLevel() == null || alert.getExperienceLevel() == job.getExperienceLevel();
    }

    private void deliver(JobAlert alert, List<Job> jobs) {
        Optional<User> owner = userRepository.findById(alert.getUserId()).filter(User::isEnabled);
        if (owner.isEmpty()) return;
        User user = owner.get();
        Job first = jobs.get(0);
        String title = jobs.size() == 1 ? "New job: " + first.getTitle() : jobs.size() + " new jobs for \"" + alert.getName() + "\"";
        String body = jobs.size() == 1
            ? first.getCompanyName() + " · " + Objects.toString(first.getLocation(), "") + " — matches your alert \"" + alert.getName() + "\""
            : "Including " + first.getTitle() + " at " + first.getCompanyName() + ".";
        notificationService.notify(user.getId(), NotificationType.JOB_ALERT, title, body,
            jobs.size() == 1 ? first.getId() : alert.getId(), jobs.size() == 1 ? "JOB" : "ALERT");

        if (alert.isEmailEnabled()) {
            List<String> lines = new ArrayList<>();
            lines.add("Hi " + user.getFirstName() + ", here " + (jobs.size() == 1 ? "is a new job" : "are new jobs")
                + " matching your alert \"" + alert.getName() + "\":");
            jobs.stream().limit(MAX_JOBS_IN_DIGEST).forEach(j -> lines.add("• " + j.getTitle() + " — " + j.getCompanyName()
                + (j.getLocation() != null ? " · " + j.getLocation() : "") + "\n" + mailService.link("/jobs/" + j.getId())));
            if (jobs.size() > MAX_JOBS_IN_DIGEST) lines.add("…and " + (jobs.size() - MAX_JOBS_IN_DIGEST) + " more.");
            lines.add("Don't want these emails? Unsubscribe: " + mailService.link("/alerts/unsubscribe?token=" + alert.getUnsubscribeToken()));
            mailService.send(user.getEmail(), title, title, lines, "View jobs", mailService.link(searchPath(alert)));
        }
        alert.setLastSentAt(Instant.now());
        alertRepository.save(alert);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private long currentMatches(JobAlert a) {
        return jobRepository.searchExtended(JobStatus.OPEN, blank(a.getKeyword()), blank(a.getLocation()), null,
            a.getJobType(), a.getExperienceLevel(), null, null, blank(a.getCategory()), false, PageRequest.of(0, 1)).getTotalElements();
    }

    /** Jobs page URL with the alert's filters applied. */
    private static String searchPath(JobAlert a) {
        StringJoiner q = new StringJoiner("&", "/jobs?", "").setEmptyValue("/jobs");
        if (notBlank(a.getKeyword())) q.add("keyword=" + enc(a.getKeyword()));
        if (notBlank(a.getLocation())) q.add("location=" + enc(a.getLocation()));
        if (notBlank(a.getCategory())) q.add("category=" + enc(a.getCategory()));
        // Parameter names used by the web app's /jobs page.
        if (a.getJobType() != null) q.add("type=" + a.getJobType());
        if (a.getExperienceLevel() != null) q.add("level=" + a.getExperienceLevel());
        return q.toString();
    }

    private void apply(JobAlert a, JobAlertRequest r) {
        a.setKeyword(blank(r.keyword()));
        a.setLocation(blank(r.location()));
        a.setCategory(blank(r.category()));
        a.setJobType(r.jobType());
        a.setExperienceLevel(r.experienceLevel());
        if (a.getKeyword() == null && a.getLocation() == null && a.getCategory() == null
            && a.getJobType() == null && a.getExperienceLevel() == null) {
            throw new BadRequestException("Choose at least one filter (keyword, location, category, job type or level)");
        }
        if (r.frequency() != null) a.setFrequency(r.frequency());
        if (r.active() != null) a.setActive(r.active());
        if (r.emailEnabled() != null) a.setEmailEnabled(r.emailEnabled());
        String name = blank(r.name());
        a.setName(name != null ? name : defaultName(a));
    }

    private static String defaultName(JobAlert a) {
        List<String> parts = new ArrayList<>();
        if (a.getKeyword() != null) parts.add(a.getKeyword());
        if (a.getCategory() != null) parts.add(a.getCategory());
        if (a.getLocation() != null) parts.add("in " + a.getLocation());
        String name = parts.isEmpty() ? "My job alert" : String.join(" ", parts);
        return name.length() > 100 ? name.substring(0, 100) : name;
    }

    private JobAlert own(UUID id, User user) {
        return alertRepository.findById(id).filter(a -> a.getUserId().equals(user.getId()))
            .orElseThrow(() -> new ResourceNotFoundException("Job alert", "id", id));
    }

    private JobAlertDTO toDTO(JobAlert a) {
        return new JobAlertDTO(a.getId(), a.getName(), a.getKeyword(), a.getLocation(), a.getCategory(), a.getJobType(),
            a.getExperienceLevel(), a.getFrequency(), a.isActive(), a.isEmailEnabled(), currentMatches(a),
            a.getLastSentAt(), a.getCreatedAt());
    }

    private static String newToken() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static String blank(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String enc(String s) {
        return java.net.URLEncoder.encode(s.trim(), java.nio.charset.StandardCharsets.UTF_8);
    }
}
