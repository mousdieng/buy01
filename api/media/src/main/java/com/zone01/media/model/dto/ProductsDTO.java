package com.zone01.media.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

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

    private boolean active;
    private boolean deleted;
    private Date createdAt;
    private Date updatedAt;
    private Date deletedAt;
}