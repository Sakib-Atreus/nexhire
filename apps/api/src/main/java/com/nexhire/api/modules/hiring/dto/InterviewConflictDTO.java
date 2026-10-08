package com.nexhire.api.modules.hiring.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * One of the scheduling recruiter's own interviews that overlaps a proposed time (who is always "YOU").
 * Details are withheld (label "Another interview", ids null) for jobs the recruiter can no longer manage.
 */
public record InterviewConflictDTO(
    String who,
    UUID interviewId,
    UUID applicationId,
    Instant scheduledAt,
    int durationMinutes,
    String label
) {}
