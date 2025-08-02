package com.zone01.media.config.kafka;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zone01.media.model.Role;
import com.zone01.media.model.dto.ProductsDTO;
import com.zone01.media.model.dto.UserDTO;
import com.zone01.media.model.Response;
import jakarta.servlet.http.HttpServletRequest;
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
public class ProductServices {
    private final ObjectMapper jacksonObjectMapper;

    private final ReplyingKafkaTemplate<String, Object, Response<?>> replyingProductKafkaTemplate;
    private static final long REPLY_TIMEOUT_SECONDS = 30;

    private static final String GET_PRODUCT_MEDIA_REQUEST = "media-request-to-get-product";
    private static final String MARK_PRODUCT_ACTIVE_MEDIA_REQUEST = "media-request-to-active-product";

    public Response<ProductsDTO> getProductByID(String productId, HttpServletRequest request) {
        try {
            ProducerRecord<String, Object> record = new ProducerRecord<>(GET_PRODUCT_MEDIA_REQUEST, productId);

            Response<?> response = this.handleKafkaRequest(record);
            if (response.isError()) return Response.mapper(response);

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

    public Response<List<ProductsDTO>> markProductAsActive(Map<String, Boolean> product) {
        try {
            ProducerRecord<String, Object> record = new ProducerRecord<>(MARK_PRODUCT_ACTIVE_MEDIA_REQUEST, product);
            Response<?> response = this.handleKafkaRequest(record);
            if (response.isError()) return Response.mapper(response);
            List<ProductsDTO> products = convertToProductDTOList(response.getData());
            return Response.build(products, response.getMessage(), HttpStatus.valueOf(response.getStatus()));
        } catch (Exception e) {
            return Response.badRequest(e.getMessage());
        }
    }

    private Response<?> handleKafkaRequest(ProducerRecord<String, Object> record) throws Exception {
        record.headers().add("X-Correlation-ID", UUID.randomUUID().toString().getBytes());
        record.headers().add("X-Correlation-Source", "media".getBytes());

        RequestReplyFuture<String, Object, Response<?>> replyFuture =
                replyingProductKafkaTemplate.sendAndReceive(record);

        Response<?> productResponse = replyFuture.get(REPLY_TIMEOUT_SECONDS, TimeUnit.SECONDS).value();
        log.info("Response Coming from product service: ====== {} ======", productResponse);

        return productResponse;
    }

    private List<ProductsDTO> convertToProductDTOList(Object data) throws Exception {
        if (data == null) return null;


        if (data instanceof List<?> list) {
            // Check if all elements are ProductsDTO instances
            boolean allProductsDTO = !list.isEmpty() &&
                    list.stream().allMatch(item -> item instanceof ProductsDTO);

            if (allProductsDTO) {
                @SuppressWarnings("unchecked")
                List<ProductsDTO> productList = (List<ProductsDTO>) data;
                return productList;
            }

            // Fallback to JSON conversion
            String json = jacksonObjectMapper.writeValueAsString(data);
            return jacksonObjectMapper.readValue(json, new TypeReference<>() {});
        } else {
            String json = jacksonObjectMapper.writeValueAsString(data);
            ProductsDTO product = jacksonObjectMapper.readValue(json, ProductsDTO.class);
            return List.of(product);
        }
    }

}
