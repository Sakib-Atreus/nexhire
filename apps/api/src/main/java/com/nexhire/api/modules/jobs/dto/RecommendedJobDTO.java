package com.nexhire.api.modules.jobs.dto;

import java.util.List;

/** A job suggested to a candidate: 0–100 match and the profile skills it matched. */
public record RecommendedJobDTO(
    JobDTO job,
    int matchScore,
    List<String> matchedSkills
) {}
