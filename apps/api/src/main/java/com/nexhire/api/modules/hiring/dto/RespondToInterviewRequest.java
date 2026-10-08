package com.nexhire.api.modules.hiring.dto;

import com.nexhire.api.modules.hiring.InterviewResponse;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

/** ACCEPTED, DECLINED, or NEW_TIME_REQUESTED with 1–3 proposed future times. */
public record RespondToInterviewRequest(
    @NotNull InterviewResponse response,
    @Size(max = 1000) String note,
    @Size(max = 3, message = "Suggest up to 3 times") List<Instant> proposedTimes
) {}
