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

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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

            record.headers().add("X-Correlation-ID", UUID.randomUUID().toString().getBytes());
            record.headers().add("X-Correlation-Source", "product".getBytes());

            // Send and receive the response
            RequestReplyFuture<String, Object, Response<?>> replyFuture =
                    replyingProductKafkaTemplate.sendAndReceive(record);

            // Wait for response
            Response<?> productResponse = replyFuture.get(REPLY_TIMEOUT_SECONDS, TimeUnit.SECONDS).value();
            log.info("Response Coming from product service: ====== {} ======", productResponse);
            System.out.println(productResponse);
            if (productResponse.getStatus() != 200 && productResponse.getStatus() != 404) {
                return Response.build(null, productResponse.getMessage(), HttpStatus.valueOf(productResponse.getStatus()));
            }

            // Safe type conversion with proper error handling
            List<ProductDTO> products = convertToProductDTOList(productResponse.getData());
            return Response.build(products, productResponse.getMessage(), HttpStatus.valueOf(productResponse.getStatus()));

        } catch (Exception e) {
            log.error("Error in getProducts for productIds: {}", productIds, e);
            String errorMessage = e.getMessage();
            String jsonPart = extractJsonFromErrorMessage(errorMessage);

            if (jsonPart != null) {
                try {
                    // Parse the JSON string into a Response class
                    Response<Map<String, Object>> jsonResponse = jacksonObjectMapper.readValue(jsonPart,
                            new TypeReference<Response<Map<String, Object>>>() {});
                    return Response.build(null, jsonResponse.getMessage(), HttpStatus.valueOf(jsonResponse.getStatus()));
                } catch (IOException ex) {
                    log.error("Failed to parse JSON from error message", ex);
                    return Response.badRequest(errorMessage);
                }
            } else {
                return Response.badRequest(errorMessage);
            }
        }
    }

    public Response<List<ProductDTO>> updateQuantities(Map<String, Integer> products) {
        try {
            ProducerRecord<String, Object> record = new ProducerRecord<>(UPDATE_PRODUCTS_REQUEST_BY_ORDER, products);

            record.headers().add("X-Correlation-ID", UUID.randomUUID().toString().getBytes());
            record.headers().add("X-Correlation-Source", "product".getBytes());

            // Send and receive the response
            RequestReplyFuture<String, Object, Response<?>> replyFuture =
                    replyingProductKafkaTemplate.sendAndReceive(record);

            // Wait for response
            Response<?> productResponse = replyFuture.get(REPLY_TIMEOUT_SECONDS, TimeUnit.SECONDS).value();
            log.info("Response Coming from product service: ====== {} ======", productResponse);
            System.out.println(productResponse);
            if (productResponse.getStatus() != 200 && productResponse.getStatus() != 404) {
                return Response.build(null, productResponse.getMessage(), HttpStatus.valueOf(productResponse.getStatus()));
            }

            return Response.build(convertToProductDTOList(productResponse.getData()), productResponse.getMessage(), HttpStatus.valueOf(productResponse.getStatus()));

        } catch (Exception e) {
            log.error("Error in getProducts for productIds: {}", products, e);
            String errorMessage = e.getMessage();
            String jsonPart = extractJsonFromErrorMessage(errorMessage);

            if (jsonPart != null) {
                try {
                    // Parse the JSON string into a Response class
                    Response<Map<String, Object>> jsonResponse = jacksonObjectMapper.readValue(jsonPart,
                            new TypeReference<Response<Map<String, Object>>>() {});
                    return Response.build(null, jsonResponse.getMessage(), HttpStatus.valueOf(jsonResponse.getStatus()));
                } catch (IOException ex) {
                    log.error("Failed to parse JSON from error message", ex);
                    return Response.badRequest(errorMessage);
                }
            } else {
                return Response.badRequest(errorMessage);
            }
        }
    }


    @SuppressWarnings("unchecked")
    private List<ProductDTO> convertToProductDTOList(Object data) {
        if (data == null) {
            return null;
        }

        try {
            if (data instanceof List) {
                // Check if it's already a List<ProductDTO>
                List<?> list = (List<?>) data;
                if (!list.isEmpty() && list.get(0) instanceof ProductDTO) {
                    return (List<ProductDTO>) data;
                }

                // Convert the list to List<ProductDTO> using Jackson
                String json = jacksonObjectMapper.writeValueAsString(data);
                return jacksonObjectMapper.readValue(json, new TypeReference<List<ProductDTO>>() {});
            } else {
                // If it's a single object, try to convert it to ProductDTO and wrap in list
                String json = jacksonObjectMapper.writeValueAsString(data);
                ProductDTO product = jacksonObjectMapper.readValue(json, ProductDTO.class);
                return List.of(product);
            }
        } catch (Exception e) {
            log.error("Error converting data to List<ProductDTO>: {}", data, e);
            throw new RuntimeException("Failed to convert response data to ProductDTO list", e);
        }
    }

    private String extractJsonFromErrorMessage(String errorMessage) {
        if (errorMessage == null) {
            return null;
        }

        // Regular expression to capture JSON inside the error message
        Pattern jsonPattern = Pattern.compile("(\\{.*\\})");
        Matcher matcher = jsonPattern.matcher(errorMessage);

        if (matcher.find()) {
            return matcher.group(1); // Return the matched JSON part
        }

        return null;
    }
}