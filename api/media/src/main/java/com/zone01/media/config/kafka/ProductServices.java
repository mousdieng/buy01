package com.zone01.media.config.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zone01.media.model.Role;
import com.zone01.media.model.dto.ProductsDTO;
import com.zone01.media.model.dto.UserDTO;
import com.zone01.media.model.Response;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.requestreply.ReplyingKafkaTemplate;
import org.springframework.kafka.requestreply.RequestReplyFuture;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ProductServices {
    private final ObjectMapper jacksonObjectMapper;

    private final ReplyingKafkaTemplate<String, String, Response<?>> replyingProductKafkaTemplate;
    private static final long REPLY_TIMEOUT_SECONDS = 30;

    private static final String MEDIA_REQUEST = "media-request-to-product";

    public Response<ProductsDTO> getProductByID(String productId, HttpServletRequest request) {
        try {
            ProducerRecord<String, String> record =
                    new ProducerRecord<>(MEDIA_REQUEST, productId);

            record.headers().add("X-Correlation-ID", UUID.randomUUID().toString().getBytes());
            record.headers().add("X-Correlation-Source", "media".getBytes());

            RequestReplyFuture<String, String, Response<?>> replyFuture =
                    replyingProductKafkaTemplate.sendAndReceive(record);

            Response<?> response = replyFuture.get(REPLY_TIMEOUT_SECONDS, TimeUnit.SECONDS).value();
            if (response.isError())
                return Response.mapper(response);

            ProductsDTO product = jacksonObjectMapper.convertValue(response.getData(), ProductsDTO.class);
            UserDTO currentUser = AccessValidation.getCurrentUser(request);
            return Response.when(
                    !currentUser.getId().equals(product.getUserID()) || currentUser.getRole() != Role.SELLER,
                    () -> Response.forbidden("You cannot perform this operation."),
                    () -> Response.build(product, response.getMessage(), HttpStatus.valueOf(response.getStatus()))
            );
        } catch (Exception e) {
            return Response.badRequest(e.getMessage());
        }
    }

}
