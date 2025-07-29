package com.zone01.product.product;

import com.zone01.product.dto.ProductAvailableRequest;
import com.zone01.product.dto.ProductSearchCriteria;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
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

import com.zone01.product.dto.CreateProductDTO;
import com.zone01.product.dto.UpdateProductsDTO;
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
    public ResponseEntity<Response<Page<Products>>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "0") int size
            ) {
        Page<Products> products = productsService.getAllProducts(page, size);
        Response<Page<Products>> response = Response.<Page<Products>>builder()
                .status(HttpStatus.OK.value())
                .data(products)
                .message("success")
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping("/available")
    public ResponseEntity<Response<List<Products>>> getAvailableProducts(@RequestBody List<ProductAvailableRequest> products) {
        Response<List<Products>> response = productsService.isProductAvailable(products);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

//    @PutMapping("/quantity-update")
//    public ResponseEntity<Response<List<Products>>> updateProductQuantities(@RequestBody List<ProductAvailableRequest> products) {
//        Response<List<Products>> response = productsService.updateProductQuantities(products);
//        return ResponseEntity.status(response.getStatus()).body(response);
//    }

    @GetMapping("/search")
    public ResponseEntity<Response<Page<Products>>> searchProducts(
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
        Page<Products> products = productsService.searchProducts(criteria);
        Response<Page<Products>> response = Response.<Page<Products>>builder()
                .status(HttpStatus.OK.value())
                .data(products)
                .message("success")
                .build();

        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Response<Products>> getProductById(@PathVariable String id) {
        return productsService.getProductById(id)
                .map(product -> {
                    Response<Products> response = Response.<Products>builder()
                            .status(HttpStatus.OK.value())
                            .data(product)
                            .message("success")
                            .build();
                    return ResponseEntity.status(HttpStatus.OK).body(response);
                })
                .orElseGet(() -> {
                    Response<Products> response = Response.<Products>builder()
                            .status(HttpStatus.NOT_FOUND.value())
                            .data(null)
                            .message("Product not found")
                            .build();
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                });
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<Response<Page<Products>>> getProductsByUserId(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "0") int size
    ) {
        Page<Products> product = productsService.getProductByUserId(id, page, size);
        Response<Page<Products>> response = Response.<Page<Products>>builder()
                .status(HttpStatus.OK.value())
                .data(product)
                .message("success")
                .build();
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping("/")
    public ResponseEntity<Response<Products>> createProduct(@Validated @RequestBody CreateProductDTO product, HttpServletRequest request) {
        Products createdProduct = productsService.createProduct(product, request);
        Response<Products> response = Response.<Products>builder()
                .status(HttpStatus.CREATED.value())
                .data(createdProduct)
                .message("success")
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Response<Object>> updateProduct(
            @PathVariable String id,
            @RequestBody UpdateProductsDTO updateProductsDTO,
            HttpServletRequest request) {
        Response<Object> updatedProduct = productsService.updateProduct(request, id, updateProductsDTO);
        return ResponseEntity.status(updatedProduct.getStatus()).body(updatedProduct);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Response<Object>> deleteProduct(@PathVariable String id, HttpServletRequest request) {
        Response<Object> deletedProduct = productsService.deleteProduct(id, request);
        return ResponseEntity.status(deletedProduct.getStatus()).body(deletedProduct);
    }
}