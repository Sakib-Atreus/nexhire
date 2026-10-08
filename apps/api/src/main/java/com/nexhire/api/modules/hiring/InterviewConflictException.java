package com.nexhire.api.modules.hiring;

import com.nexhire.api.modules.hiring.dto.InterviewConflictDTO;
import lombok.Getter;

import java.util.List;

/** Thrown when a proposed interview overlaps others and the caller hasn't confirmed it (HTTP 409). */
@Getter
public class InterviewConflictException extends RuntimeException {

    private final List<InterviewConflictDTO> conflicts;

    public InterviewConflictException(List<InterviewConflictDTO> conflicts) {
        super(conflicts.size() == 1 ? "This time clashes with another interview" : "This time clashes with " + conflicts.size() + " interviews");
        this.conflicts = conflicts;
    }
}
