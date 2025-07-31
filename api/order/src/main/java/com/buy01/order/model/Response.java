package com.buy01.order.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.function.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Slf4j
public class Response<T> {
    private int status;
    private T data;
    private String message;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    private List<String> errors;

    /**
     * Reusable response builder
     */
    public static <T> Response<T> build(T data, String message, HttpStatus status) {
        return Response.<T>builder()
                .data(data)
                .message(message)
                .status(status.value())
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Success and error predicates
     */
    public static final Predicate<Response<?>> IS_SUCCESS = response ->
            response.status >= 200 && response.status < 300;

    public static final Predicate<Response<?>> IS_ERROR = response ->
            response.status >= 400;

    // ============ STATIC FACTORY METHODS ============

    public static <T> Response<T> response(T data, String message, int status) {
        return build(data, message, HttpStatus.valueOf(status));
    }

    public static <T> Response<T> response(T data, String message, int status, List<String> errors) {
        Response<T> response = response(data, message, status);
        response.setErrors(errors);
        return response;
    }

    public static <T> void response(
            HttpServletResponse response,
            ObjectMapper jacksonObjectMapper,
            T data,
            String message,
            HttpStatus status
    ) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        var apiResponse = Response.build(data, message, status);
        jacksonObjectMapper.writeValue(response.getWriter(), apiResponse);
    }


    // Success responses
    public static <T> Response<T> ok(T data, String message) {
        return build(data, message, HttpStatus.OK);
    }

    public static <T> Response<T> ok(T data) {
        return ok(data, "Success");
    }

    public static <T> Response<T> created(T data, String message) {
        return build(data, message, HttpStatus.CREATED);
    }

    public static <T> Response<T> created(T data) {
        return created(data, "Resource created successfully");
    }

    // Error responses
    public static <T> Response<T> notFound(String message) {
        return build(null, message, HttpStatus.NOT_FOUND);
    }

    public static <T> Response<T> notFound() {
        return notFound("Resource not found");
    }

    public static <T> Response<T> badRequest(String message) {
        return build(null, message, HttpStatus.BAD_REQUEST);
    }

    public static <T> Response<T> badRequest(T data, String message) {
        return build(data, message, HttpStatus.BAD_REQUEST);
    }

    public static <T> Response<T> badRequest(List<String> errors, String message) {
        Response<T> response = badRequest(message);
        response.setErrors(errors);
        return response;
    }

    public static <T> Response<T> unauthorized(String message) {
        return build(null, message, HttpStatus.UNAUTHORIZED);
    }

    public static <T> Response<T> unauthorized() {
        return unauthorized("Unauthorized access");
    }

    public static <T> Response<T> forbidden(String message) {
        return build(null, message, HttpStatus.FORBIDDEN);
    }

    public static <T> Response<T> forbidden() {
        return forbidden("Access forbidden");
    }

    public static <T> Response<T> conflict(String message) {
        return build(null, message, HttpStatus.CONFLICT);
    }

    public static <T> Response<T> internalServerError(String message) {
        return build(null, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    public static <T> Response<T> internalServerError() {
        return internalServerError("Internal server error");
    }

    // ============ UTILITY METHODS ============

    public boolean isSuccess() {
        return IS_SUCCESS.test(this);
    }

    public boolean isError() {
        return IS_ERROR.test(this);
    }

    public boolean hasErrors() {
        return errors != null && !errors.isEmpty();
    }

    public static <T, U> Response<T> mapper(Response<U> response) {
        return build(null, response.getMessage(), HttpStatus.valueOf(response.status));
    }

    /**
     * Convert to Optional based on success status
     */
    public Optional<T> toOptional() {
        return isSuccess() ? Optional.ofNullable(data) : Optional.empty();
    }

    /**
     * Get data or return default value
     */
    public T getDataOrDefault(T defaultValue) {
        return isSuccess() ? data : defaultValue;
    }

    /**
     * Apply operation if condition is true
     */
    public Response<T> applyIf(boolean condition, UnaryOperator<Response<T>> operation) {
        return condition ? operation.apply(this) : this;
    }

    /**
     * Conditional response creation
     */
    public static <T> Response<T> when(boolean condition, Supplier<Response<T>> trueResponse, Supplier<Response<T>> falseResponse) {
        return condition ? trueResponse.get() : falseResponse.get();
    }

}