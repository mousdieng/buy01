package com.zone01.users.config.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zone01.users.user.User;
import com.zone01.users.model.Response;
import com.zone01.users.config.jwt.JwtService;
import com.zone01.users.model.JwtValidationResponse;
import com.zone01.users.model.dto.UserDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationKafkaListener {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final JwtService jwtService;

    // Function to extract and clean authorization header
    private String extractAuthHeader(Object value) {
        return  Optional.ofNullable(objectMapper.convertValue(value, String.class))
                .map(header -> header.startsWith("\"") && header.endsWith("\"")
                        ? header.substring(1, header.length() - 1).trim()
                        : header.trim())
                .orElse(null);
    }


    // Function to extract correlation ID
    private final Function<ConsumerRecord<String, Object>, byte[]> extractCorrelationId = record ->
            Optional.ofNullable(record.headers().lastHeader(KafkaHeaders.CORRELATION_ID))
                    .map(header -> header.value())
                    .orElse(null);

    // Supplier for error response
    private final Supplier<Response<UserDTO>> createErrorResponse = () ->
            Response.unauthorized("Error processing authentication request");

    // Main authentication processor
    private Response<UserDTO> authProcessor(String authHeader) {
        try {
            log.info("====== Checking the authentication header from kafka ========");
            JwtValidationResponse jwtValidationResponse = jwtService.validateJwt(authHeader);
            if (jwtValidationResponse.hasError()) {
                log.error("====== Failed checking the authentication header from kafka: {} ========", jwtValidationResponse.response().getMessage());
                return Response.mapper(jwtValidationResponse.response());
            }

            log.info("====== Successfully checking the authentication header from kafka ========");
            return Optional.of(jwtValidationResponse.userDetails())
                    .filter(User.class::isInstance)
                    .map(User.class::cast)
                    .map(User::toUserDTO)
                    .map(Response::ok)
                    .orElse(createErrorResponse.get());

        } catch (Exception e) {
            log.error("Error processing authentication request", e);
            var s = createErrorResponse.get();
            return createErrorResponse.get();
        }
    };

    // Response sender implementation
    private void responseSender(Response<Object> response, byte[] correlationId, String topic) {
        Message<Response<Object>> message = MessageBuilder
                .withPayload(response)
                .setHeader(KafkaHeaders.TOPIC, topic)
                .setHeader(KafkaHeaders.CORRELATION_ID, correlationId)
                .build();

        kafkaTemplate.send(message);
    };

    // Generic request handler using functional approach
    private final Consumer<ConsumerRecord<String, Object>> createRequestHandler(String responseTopic) {
        return record -> {
            log.info("====== Received authentication request from topic: {}, key: {} ======", record.topic(), record.key());

            String authHeader = extractAuthHeader(record.value());
            byte[] correlationId = extractCorrelationId.apply(record);
            responseSender(
                    Response.ok(authProcessor(authHeader).getData())
                    , correlationId, responseTopic);
        };
    }

    @KafkaListener(
            topics = "auth-request-product",
            groupId = "auth-group-product",
            containerFactory = "authKafkaListenerContainerFactory"
    )
    public void handleAuthRequestProduct(ConsumerRecord<String, Object> record) {
        createRequestHandler("auth-response-product").accept(record);
    }

    @KafkaListener(
            topics = "auth-request-media",
            groupId = "auth-group-media",
            containerFactory = "authKafkaListenerContainerFactory"
    )
    public void handleAuthRequestMedia(ConsumerRecord<String, Object> record) {
        createRequestHandler("auth-response-media").accept(record);
    }

    @KafkaListener(
            topics = "auth-request-order",
            groupId = "auth-group-order",
            containerFactory = "authKafkaListenerContainerFactory"
    )
    public void handleAuthRequestOrder(ConsumerRecord<String, Object> record) {
        createRequestHandler("auth-response-order").accept(record);
    }
}
