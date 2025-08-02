package com.zone01.product.model.dto;

import com.zone01.product.model.Response;
import com.zone01.product.product.Products;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.commons.text.StringEscapeUtils;

import java.util.function.Predicate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProductsDTO {
    private String name;
    private String description;
    private Double price;
    private Integer quantity;

    public Response<ProductDTO> applyUpdates(Products product) {
        boolean isValueUpdated = false;

        if (this.name != null && !this.name.isEmpty()) {
            Response<ProductDTO> validationResponse = validateField("name", this.name,
                    value -> value != null &&
                            value.length() >= 2 &&
                            value.length() <= 50 &&
                            value.matches("^[A-Za-zÀ-ÿ0-9\\s'-]+$"),
                    "Invalid name format");
            if (validationResponse != null) {return validationResponse;}
            String escapedName = StringEscapeUtils.escapeHtml4(this.name.toLowerCase());
            product.setName(escapedName);
            isValueUpdated = true;
        }

        if (this.description != null && !this.description.isEmpty()) {
            Response<ProductDTO> validationResponse = validateField("description", this.description,
                    value -> value != null &&
                            value.length() >= 10 &&
                            value.length() <= 255 &&
                            value.matches("^[A-Za-zÀ-ÿ0-9\\s.,!?()'\\-]+$"),
                    "Invalid description format");

            if (validationResponse != null) {return validationResponse;}
            String escapedDescription = StringEscapeUtils.escapeHtml4(this.description.toLowerCase());
            product.setDescription(escapedDescription);
            isValueUpdated = true;
        }

        // Price update
        if (this.price != null) {
            Response<ProductDTO> validationResponse = validateField("price", this.price,
                    value -> value != null &&
                            value >= 0.01 &&
                            value <= 100000.00,
                    "Invalid price range");

            if (validationResponse != null) {return validationResponse;}
            product.setPrice(this.price);
            isValueUpdated = true;
        }

        // Quantity update
        if (this.quantity != null) {
            Response<ProductDTO> validationResponse = validateField("quantity", this.quantity,
                    value -> value != null &&
                            value > 0 &&
                            value <= 10000,
                    "Invalid quantity");

            if (validationResponse != null) {return validationResponse;}
            product.setQuantity(this.quantity);
            isValueUpdated = true;
        }

        return Response.when(
                !isValueUpdated,
                () -> Response.badRequest("No value is submitted.")
        );
    }

    private <T> Response<ProductDTO> validateField(String fieldName, T value, Predicate<T> validator, String errorMessage) {
        return Response.when(
                value == null || !validator.test(value),
                () -> Response.badRequest(fieldName + ": " + errorMessage)
        );
    }
}