package com.zone01.product.product;


import com.zone01.product.model.dto.ProductDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "products")
public class Products {
    @Id
    private String id;
    private String name;
    private String description;
    private Double price;
    private Integer quantity;
    @Field("user_id")
    private String userID;

    private boolean active = false;
    private boolean deleted = false;
    private Date createdAt = new Date();
    private Date updatedAt;
    private Date deletedAt;

    public ProductDTO toProductDTO() {
        return ProductDTO.builder()
                .id(this.getId())
                .name(this.getName())
                .description(this.getDescription())
                .price(this.getPrice())
                .quantity(this.getQuantity())
                .userID(this.getUserID())
                .active(this.isActive())
                .createdAt(this.getCreatedAt())
                .updatedAt(this.getUpdatedAt())
                .build();
    }

    public static List<ProductDTO> toProductsDTO(List<Products> product) {
        return product.stream().map(Products::toProductDTO).toList();
    }

    public static Page<ProductDTO> toProductsDTO(Page<Products> productsPage) {
        return productsPage.map(Products::toProductDTO);
    }
}