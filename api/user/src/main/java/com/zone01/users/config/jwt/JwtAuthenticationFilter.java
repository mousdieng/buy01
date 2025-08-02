package com.zone01.users.config.jwt;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zone01.users.model.JwtValidationResponse;
import com.zone01.users.model.Response;
import com.zone01.users.user.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final ObjectMapper jacksonObjectMapper;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        log.info("======== Filtering Request with url: {}, method: {} ========", request.getServletPath(), request.getMethod());
        if (request.getServletPath().contains("/api/v1/user/auth") || request.getServletPath().contains("/api/v1/user/avatar")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        JwtValidationResponse jwtValidationResponse = jwtService.validateJwt(authHeader);
        if (jwtValidationResponse.hasError()) {
            log.error("====== Failed checking authorization header: {} ========", jwtValidationResponse.response().getMessage());
            setErrorResponse(response, jwtValidationResponse.response());
            return;
        }

        log.info("======== Successfully Check the authentication header ========");
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                jwtValidationResponse.userDetails(),
                null,
                jwtValidationResponse.userDetails().getAuthorities()
        );
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);
        filterChain.doFilter(request, response);
    }

    private void setErrorResponse(HttpServletResponse response, Response<Object> errorResponse) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        jacksonObjectMapper.writeValue(response.getWriter(), errorResponse);
    }

    public static User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        throw new IllegalStateException("No authenticated user found");
    }
}
