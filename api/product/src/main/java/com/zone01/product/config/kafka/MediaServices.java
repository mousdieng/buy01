package com.zone01.product.config.kafka;

import com.zone01.product.model.Response;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.kafka.requestreply.ReplyingKafkaTemplate;
import org.springframework.kafka.requestreply.RequestReplyFuture;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class MediaServices {
    private final ReplyingKafkaTemplate<String, Object, Response<?>> replyingMediaKafkaTemplate;
    private static final long REPLY_TIMEOUT_SECONDS = 30;
    private static final String PRODUCT_REQUEST = "product-request-to-media";

    public Response<Object> deleteMediaRelatedToProduct(List<String> productIds) {
        try {
            ProducerRecord<String, Object> record = new ProducerRecord<>(PRODUCT_REQUEST, productIds);

            record.headers().add("X-Correlation-ID", UUID.randomUUID().toString().getBytes());
            record.headers().add("X-Correlation-Source", "media".getBytes());

            RequestReplyFuture<String, Object, Response<?>> replyFuture =
                    replyingMediaKafkaTemplate.sendAndReceive(record);

            Response<?> response = replyFuture.get(REPLY_TIMEOUT_SECONDS, TimeUnit.SECONDS).value();
            return Response.when(
                    response.isError() && response.getStatus() != 404,
                    () -> Response.mapper(response)
            );
        } catch (Exception e) {
            return Response.badRequest(e.getMessage());
        }
    }
}
