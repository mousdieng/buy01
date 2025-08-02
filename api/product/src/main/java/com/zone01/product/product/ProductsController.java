package com.zone01.product.product;

import com.zone01.product.model.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.zone01.product.model.Response;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/product")
public class ProductsController {
    private final ProductsService productsService;

    @GetMapping()
    public ResponseEntity<Response<Page<ProductDTO>>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "0") int size
            ) {
        Response<Page<ProductDTO>> response = productsService.getAllProducts(page, size);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @PostMapping("/available")
    public ResponseEntity<Response<List<ProductDTO>>> getAvailableProducts(@RequestBody List<ProductAvailableRequest> products) {
        Response<List<ProductDTO>> response = productsService.isProductAvailable(products);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @GetMapping("/search")
    public ResponseEntity<Response<Page<ProductDTO>>> searchProducts(
            // Basic search parameters
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String name,

            // Single value filters (backward compatibility)
            @RequestParam(required = false) String price,
            @RequestParam(required = false) String quantity,

            // Range filters
            @RequestParam(required = false) Double priceMin,
            @RequestParam(required = false) Double priceMax,
            @RequestParam(required = false) Integer quantityMin,
            @RequestParam(required = false) Integer quantityMax,

            // Array filters
            @RequestParam(required = false) List<String> userIds,
            @RequestParam(required = false) List<String> categoryIds,
            @RequestParam(required = false) List<String> tags,

            // Sorting
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String sortOrder,

            // Pagination
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        ProductSearchCriteria criteria = ProductSearchCriteria.builder()
                .keyword(keyword)
                .name(name)
                .price(price)
                .quantity(quantity)
                .priceMin(priceMin)
                .priceMax(priceMax)
                .quantityMin(quantityMin)
                .quantityMax(quantityMax)
                .userIds(userIds)
                .categoryIds(categoryIds)
                .tags(tags)
                .sortBy(sortBy)
                .sortOrder(sortOrder)
                .page(page)
                .size(size)
                .build();
        Response<Page<ProductDTO>> response = productsService.searchProducts(criteria);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Response<ProductDTO>> getProductById(@PathVariable String id) {
        var response = productsService.getProductById(id);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @GetMapping("/{id}/all")
    public ResponseEntity<Response<ProductDTO>> getProductByIdEvenDeletedOrNoneActivated(@PathVariable String id) {
        var response = productsService.getProductByIdEvenDeletedOrNoneActivated(id);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<Response<Page<ProductDTO>>> getProductsByUserId(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "0") int size
    ) {
        Response<Page<ProductDTO>> response = productsService.getProductByUserId(id, page, size);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @PostMapping("/")
    public ResponseEntity<Response<ProductDTO>> createProduct(@Validated @RequestBody CreateProductDTO product, HttpServletRequest request) {
        Response<ProductDTO> response = productsService.createProduct(product, request);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Response<ProductDTO>> updateProduct(
            @PathVariable String id,
            @RequestBody UpdateProductsDTO updateProductsDTO,
            HttpServletRequest request) {
        Response<ProductDTO> response = productsService.updateProduct(request, id, updateProductsDTO);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Response<ProductDTO>> deleteProduct(@PathVariable String id, HttpServletRequest request) {
        Response<ProductDTO> response = productsService.deleteProduct(id, request);
        return ResponseEntity.status(response.getStatus()).body(response);
    }
}