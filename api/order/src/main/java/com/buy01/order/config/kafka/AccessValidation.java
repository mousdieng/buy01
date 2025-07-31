package com.buy01.order.config.kafka;

import com.buy01.order.model.Response;
import com.buy01.order.model.dto.UserDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.requestreply.ReplyingKafkaTemplate;
import org.springframework.kafka.requestreply.RequestReplyFuture;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class AccessValidation extends OncePerRequestFilter {
    private static final String USER = "currentUser";
    private final ObjectMapper jacksonObjectMapper;

    private final ReplyingKafkaTemplate<String, String, Response<?>> replyingAuthKafkaTemplate;
    private static final long REPLY_TIMEOUT_SECONDS = 30;
    private static final String REQUEST_TOPIC = "auth-request-order";

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        log.info("====== Filtering request | url: {} | method: {} ======", request.getServletPath(), request.getMethod());
        try {
            log.info("====== Sending the authorization header to the user service ======");
            ProducerRecord<String, String> record =
                    new ProducerRecord<>(REQUEST_TOPIC, request.getHeader("Authorization"));
            record.headers().add("X-Correlation-Order", UUID.randomUUID().toString().getBytes());
            record.headers().add("X-Correlation-Source", "order".getBytes());

            // Send and receive the response
            RequestReplyFuture<String, String, Response<?>> replyFuture =
                    replyingAuthKafkaTemplate.sendAndReceive(record);

            Response<?> userResponse = replyFuture.get(REPLY_TIMEOUT_SECONDS, TimeUnit.SECONDS).value();
            log.info("====== Receiving the response from user service ======");
            if (userResponse.isError()) {
                log.error("======== The user service returned response ====== {} ", userResponse);
                Response.response(response, jacksonObjectMapper, null, userResponse.getMessage(), HttpStatus.valueOf(userResponse.getStatus()));
                return;
            }

            log.info("====== The authorization has been check by user service successfully ======");
            UserDTO user = jacksonObjectMapper.convertValue(userResponse.getData(), UserDTO.class);
            request.setAttribute(USER, user);

        } catch (Exception e) {
            Response.response(response, jacksonObjectMapper, null, e.getMessage(), HttpStatus.BAD_REQUEST);
            return;
        }

        filterChain.doFilter(request, response);
    }

    public static UserDTO getCurrentUser(HttpServletRequest request) {
        return (UserDTO) request.getAttribute(USER);
    }

}
