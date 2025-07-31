package com.buy01.order.config.kafka;

import com.buy01.order.model.dto.ProductDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.buy01.order.model.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.requestreply.ReplyingKafkaTemplate;
import org.springframework.kafka.requestreply.RequestReplyFuture;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {
    private final ObjectMapper jacksonObjectMapper;
    private final ReplyingKafkaTemplate<String, Object, Response<?>> replyingProductKafkaTemplate;

    private static final long REPLY_TIMEOUT_SECONDS = 30;
    private static final String GET_PRODUCTS_REQUEST_BY_ORDER = "get-products-request-by-order";
    private static final String UPDATE_PRODUCTS_REQUEST_BY_ORDER = "update-products-request-by-order";

    public Response<List<ProductDTO>> getProducts(List<String> productIds) {
        try {
            ProducerRecord<String, Object> record = new ProducerRecord<>(GET_PRODUCTS_REQUEST_BY_ORDER, productIds);
            return handleKafkaRequest(record);
        } catch (Exception e) {
            log.error("Error in getProducts for productIds: {}", productIds, e);
            return Response.badRequest(e.getMessage());
        }
    }

    public Response<List<ProductDTO>> updateQuantities(Map<String, Integer> products) {
        try {
            ProducerRecord<String, Object> record = new ProducerRecord<>(UPDATE_PRODUCTS_REQUEST_BY_ORDER, products);
            return handleKafkaRequest(record);
        } catch (Exception e) {
            log.error("Error in getProducts for productIds: {}", products, e);
            return Response.badRequest(e.getMessage());
        }
    }

    private Response<List<ProductDTO>> handleKafkaRequest(ProducerRecord<String, Object> record) throws Exception {
        record.headers().add("X-Correlation-ID", UUID.randomUUID().toString().getBytes());
        record.headers().add("X-Correlation-Source", "product".getBytes());

        // Send and receive the response
        RequestReplyFuture<String, Object, Response<?>> replyFuture =
                replyingProductKafkaTemplate.sendAndReceive(record);

        Response<?> productResponse = replyFuture.get(REPLY_TIMEOUT_SECONDS, TimeUnit.SECONDS).value();
        log.info("Response Coming from product service: ====== {} ======", productResponse);

        return Response.when(
                productResponse.isError() && productResponse.getStatus() != 404,
                () -> Response.mapper(productResponse),
                () -> Response.build(convertToProductDTOList(productResponse.getData()), productResponse.getMessage(), HttpStatus.valueOf(productResponse.getStatus()))
        );
    }


    @SuppressWarnings("unchecked")
    private List<ProductDTO> convertToProductDTOList(Object data) {
        if (data == null) {
            return null;
        }

        try {
            if (data instanceof List<?> list) {
                if (!list.isEmpty() && list.get(0) instanceof ProductDTO) {
                    return (List<ProductDTO>) data;
                }

                String json = jacksonObjectMapper.writeValueAsString(data);
                return jacksonObjectMapper.readValue(json, new TypeReference<List<ProductDTO>>() {});
            } else {
                String json = jacksonObjectMapper.writeValueAsString(data);
                ProductDTO product = jacksonObjectMapper.readValue(json, ProductDTO.class);
                return List.of(product);
            }
        } catch (Exception e) {
            log.error("Error converting data to List<ProductDTO>: {}", data, e);
            throw new RuntimeException("Failed to convert response data to ProductDTO list", e);
        }
    }
}