package com.nexhire.api.modules.jobs;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexhire.api.modules.applications.ApplicationRepository;
import com.nexhire.api.modules.jobs.dto.RecommendedJobDTO;
import com.nexhire.api.modules.users.User;
import com.nexhire.api.modules.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Ranks open jobs for a candidate. Score (0–100):
 * 60% skills (profile skills found in the job's tags), 20% headline words in the job title,
 * 10% location (same city, or a remote job), 10% recency. Jobs already applied to are excluded.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendationService {

    private static final Set<String> STOP_WORDS = Set.of(
        "and", "the", "for", "with", "senior", "junior", "lead", "mid", "level", "engineer", "developer", "specialist",
        "manager", "intern", "head", "staff", "principal", "associate", "remote");

    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final JobService jobService;
    private final ObjectMapper objectMapper;

    public List<RecommendedJobDTO> recommend(User principal, int size) {
        User user = userRepository.findById(principal.getId()).orElse(principal);
        Map<String, String> skills = new LinkedHashMap<>();   // normalized → as written on the profile
        for (String s : parse(user.getSkills())) skills.putIfAbsent(normalize(s), s.trim());
        Set<String> headlineWords = words(user.getHeadline());
        String city = user.getLocation() == null ? "" : user.getLocation().split(",")[0].trim().toLowerCase(Locale.ROOT);
        Set<UUID> applied = new HashSet<>(applicationRepository.findJobIdsByCandidateId(user.getId()));

        record Scored(Job job, int score, List<String> matched) {}
        List<Scored> ranked = new ArrayList<>();
        for (Job job : jobRepository.findTop300ByStatusAndHiddenFalseOrderByCreatedAtDesc(JobStatus.OPEN)) {
            if (applied.contains(job.getId())) continue;

            List<String> tags = Arrays.stream(Objects.toString(job.getTags(), "").split(","))
                .map(String::trim).filter(t -> !t.isEmpty()).toList();
            Set<String> tagKeys = new HashSet<>();
            tags.forEach(t -> tagKeys.add(normalize(t)));
            List<String> matched = skills.entrySet().stream()
                .filter(e -> tagKeys.contains(e.getKey())).map(Map.Entry::getValue).toList();
            double skillScore = tags.isEmpty() ? 0 : Math.min(1.0, matched.size() / (double) Math.min(tags.size(), 5));

            Set<String> titleWords = words(job.getTitle());
            double titleScore = headlineWords.isEmpty() ? 0
                : Math.min(1.0, headlineWords.stream().filter(titleWords::contains).count() / 2.0);

            String jobLocation = Objects.toString(job.getLocation(), "").toLowerCase(Locale.ROOT);
            double locationScore = job.getJobType() == JobType.REMOTE || jobLocation.contains("remote") ? 1
                : (!city.isEmpty() && jobLocation.contains(city) ? 1 : 0);

            long ageDays = job.getCreatedAt() == null ? 30 : Duration.between(job.getCreatedAt(), Instant.now()).toDays();
            double recency = ageDays <= 7 ? 1 : ageDays <= 30 ? 0.5 : 0.2;

            // Only recommend jobs that relate to the profile (a skill or title match); location/recency just rank them.
            if (matched.isEmpty() && titleScore == 0) continue;
            int score = (int) Math.round(100 * (0.6 * skillScore + 0.2 * titleScore + 0.1 * locationScore + 0.1 * recency));
            ranked.add(new Scored(job, score, matched));
        }
        // Rank on the raw jobs, then build DTOs only for the ones returned.
        ranked.sort(Comparator.comparingInt(Scored::score).reversed());
        List<Scored> top = ranked.stream().limit(Math.max(1, Math.min(size, 50))).toList();
        List<com.nexhire.api.modules.jobs.dto.JobDTO> dtos = jobService.toDTOs(
            new org.springframework.data.domain.PageImpl<>(top.stream().map(Scored::job).toList()), user.getId(), false).getContent();
        List<RecommendedJobDTO> result = new ArrayList<>();
        for (int i = 0; i < top.size(); i++) result.add(new RecommendedJobDTO(dtos.get(i), top.get(i).score(), top.get(i).matched()));
        return result;
    }

    /** "Node.js" → "nodejs", "C++" → "c++": case/space/punctuation-insensitive skill keys. */
    static String normalize(String s) {
        return s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9+#]", "");
    }

    private static Set<String> words(String text) {
        Set<String> out = new HashSet<>();
        if (text == null) return out;
        for (String w : text.toLowerCase(Locale.ROOT).split("[^a-z0-9+#.]+")) {
            if (w.length() >= 3 && !STOP_WORDS.contains(w)) out.add(w);
        }
        return out;
    }

    private List<String> parse(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
