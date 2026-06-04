package com.nexhire.api.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiError {
    private int status;
    private String message;
    private String path;
    private Instant timestamp;
    private Map<String, String> fieldErrors;

    public ApiError(int status, String message, String path) {
        this.status = status;
        this.message = message;
        this.path = path;
        this.timestamp = Instant.now();
    }
}
