package com.nexhire.api.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleResourceNotFound(ResourceNotFoundException ex, WebRequest request) {
        ApiError error = new ApiError(HttpStatus.NOT_FOUND.value(), ex.getMessage(), request.getDescription(false));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiError> handleBadRequest(BadRequestException ex, WebRequest request) {
        ApiError error = new ApiError(HttpStatus.BAD_REQUEST.value(), ex.getMessage(), request.getDescription(false));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiError> handleForbidden(ForbiddenException ex, WebRequest request) {
        ApiError error = new ApiError(HttpStatus.FORBIDDEN.value(), ex.getMessage(), request.getDescription(false));
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        // Not signed in (or the token was invalid): 401 so the client refreshes its session or asks to log in.
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken) {
            ApiError unauthorized = new ApiError(HttpStatus.UNAUTHORIZED.value(), "Please sign in to continue", request.getDescription(false));
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(unauthorized);
        }
        ApiError error = new ApiError(HttpStatus.FORBIDDEN.value(), "Access denied", request.getDescription(false));
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(AuthenticationException ex, WebRequest request) {
        ApiError error = new ApiError(HttpStatus.UNAUTHORIZED.value(), "Invalid credentials", request.getDescription(false));
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, WebRequest request) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(err -> {
            String field = ((FieldError) err).getField();
            fieldErrors.put(field, err.getDefaultMessage());
        });
        ApiError error = new ApiError(HttpStatus.BAD_REQUEST.value(), "Validation failed", request.getDescription(false));
        error.setFieldErrors(fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /** Framework request errors (wrong method, unknown path, missing or malformed parameters/body) keep their 4xx status. */
    @ExceptionHandler({
        org.springframework.web.HttpRequestMethodNotSupportedException.class,
        org.springframework.web.servlet.resource.NoResourceFoundException.class,
        org.springframework.web.bind.MissingServletRequestParameterException.class,
        org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
        org.springframework.http.converter.HttpMessageNotReadableException.class
    })
    public ResponseEntity<ApiError> handleBadRequestShape(Exception ex, WebRequest request) {
        HttpStatus status = ex instanceof org.springframework.web.ErrorResponse er
            ? HttpStatus.resolve(er.getStatusCode().value()) : HttpStatus.BAD_REQUEST;
        if (status == null) status = HttpStatus.BAD_REQUEST;
        String message = switch (ex) {
            case org.springframework.web.HttpRequestMethodNotSupportedException e -> "Method " + e.getMethod() + " is not supported here";
            case org.springframework.web.servlet.resource.NoResourceFoundException e -> "Not found";
            case org.springframework.web.bind.MissingServletRequestParameterException e -> "Missing parameter '" + e.getParameterName() + "'";
            case org.springframework.web.method.annotation.MethodArgumentTypeMismatchException e -> "Invalid value for '" + e.getName() + "'";
            default -> "Malformed request body";
        };
        return ResponseEntity.status(status).body(new ApiError(status.value(), message, request.getDescription(false)));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneral(Exception ex, WebRequest request) {
        log.error("Unhandled exception", ex);
        ApiError error = new ApiError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "An unexpected error occurred", request.getDescription(false));
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
