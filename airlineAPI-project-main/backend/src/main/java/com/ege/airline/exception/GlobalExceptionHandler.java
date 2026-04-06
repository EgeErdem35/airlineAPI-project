package com.ege.airline.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice(basePackages = "com.ege.airline.controller")
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problemDetail =
                ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problemDetail.setTitle("Resource Not Found");
        problemDetail.setType(URI.create("https://example.com/errors/not-found"));
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        return problemDetail;
    }

    @ExceptionHandler(DuplicatePassengerException.class)
    public ProblemDetail handleDuplicatePassenger(DuplicatePassengerException ex, HttpServletRequest request) {
        ProblemDetail problemDetail =
                ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problemDetail.setTitle("Duplicate Passenger");
        problemDetail.setType(URI.create("https://example.com/errors/duplicate-passenger"));
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        return problemDetail;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationExceptions(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );

        ProblemDetail problemDetail =
                ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
        problemDetail.setTitle("Bad Request");
        problemDetail.setType(URI.create("https://example.com/errors/validation-error"));
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        problemDetail.setProperty("errors", errors);

        return problemDetail;
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        ProblemDetail problemDetail =
                ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
        problemDetail.setTitle("Unauthorized");
        problemDetail.setType(URI.create("https://example.com/errors/unauthorized"));
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        return problemDetail;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        ProblemDetail problemDetail =
                ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problemDetail.setTitle("Bad Request");
        problemDetail.setType(URI.create("https://example.com/errors/bad-request"));
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        return problemDetail;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGenericException(Exception ex, HttpServletRequest request) {
        ProblemDetail problemDetail =
                ProblemDetail.forStatusAndDetail(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "An unexpected error occurred."
                );
        problemDetail.setTitle("Internal Server Error");
        problemDetail.setType(URI.create("https://example.com/errors/internal-server-error"));
        problemDetail.setInstance(URI.create(request.getRequestURI()));
        return problemDetail;
    }
}