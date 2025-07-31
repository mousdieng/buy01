package com.zone01.media.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductsDTO {
    private String id;
    private String name;
    private String description;
    private Double price;
    private Integer quantity;
    private String userID;

}