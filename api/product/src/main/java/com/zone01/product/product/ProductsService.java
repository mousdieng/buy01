package com.zone01.product.product;

import com.zone01.product.config.kafka.AccessValidation;
import com.zone01.product.config.kafka.MediaServices;
import com.zone01.product.dto.*;
import com.zone01.product.model.Response;
import com.zone01.product.model.Role;
import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductsService {
    private final ProductsRepository productsRepository;
    private final MediaServices mediaServices;
    private final MongoTemplate mongoTemplate;

    public Response<Page<Products>> getAllProducts(int page, int size) {
        var products = productsRepository.findAll(PageRequest.of(page, size));
        return Response.when(
                products.isEmpty() || !products.hasContent(),
                () -> Response.ok(products),
                () -> Response.notFound("No products found!")
        );
    }

    public Response<List<Products>> isProductAvailable(List<ProductAvailableRequest> dto) {
        List<String> productIds = dto.stream()
                .map(ProductAvailableRequest::getId)
                .toList();

        List<Products> products = productsRepository.findByIdIn(productIds);

        Map<String, Products> productMap = products.stream()
                .collect(Collectors.toMap(Products::getId, Function.identity()));

        var grouped = dto.stream()
                .collect(Collectors.groupingBy(
                        request -> {
                            Products product = productMap.get(request.getId());
                            return product != null && product.getQuantity() >= request.getQuantity();
                        },
                        Collectors.mapping(
                                request -> productMap.get(request.getId()),
                                Collectors.toList()
                        )
                ));

        List<Products> available = grouped.getOrDefault(true, List.of());
        List<Products> unavailable = grouped.getOrDefault(false, List.of());
        return Response.when(
                unavailable.isEmpty(),
                () -> Response.ok(available, "All products are available"),
                () -> Response.badRequest(unavailable, "Some products are unavailable")
        );
    }

    public Response<List<Products>> updateProductQuantities(Map<String, Integer> dto) {
        List<String> productIds = new ArrayList<>(dto.keySet());

        // Fetch all matching products
        List<Products> products = productsRepository.findByIdIn(productIds);

        // Map for easy lookup
        Map<String, Products> productMap = products.stream()
                .collect(Collectors.toMap(Products::getId, Function.identity()));

        // Update quantities
        dto.forEach((productId, quantityToSubtract) -> {
            Products product = productMap.get(productId);
            if (product != null) {
                int newQuantity = product.getQuantity() - quantityToSubtract;
                product.setQuantity(Math.max(newQuantity, 0)); // Avoid negative quantity
            }
        });

        return Response.<List<Products>>builder()
                .status(HttpStatus.OK.value())
                .message("Product quantities updated successfully")
                .data(productsRepository.saveAll(productMap.values()))
                .build();
    }

    public Response<Products> getProductById(String id) {
        log.info("====== Getting product by id: {} ======", id);
        Products product = productsRepository.findById(id).orElse(null);
        return Response.when(
                product != null,
                () -> Response.ok(product, "Successfully retrieved product"),
                () -> Response.notFound("Product not found!")
        );
    }

    public Response<List<Products>> getProductById(List<String> id) {
        List<Products> products = productsRepository.findByIdIn(id);
        return Response.when(
                !products.isEmpty(),
                () -> Response.ok(products, "Successfully retrieved products"),
                () -> Response.notFound("Product not found!")
        );
    }

    public Response<Page<Products>> getProductByUserId(String id, int page, int size) {
        var products = productsRepository.findProductsByUserID(id, PageRequest.of(page, size));
        return Response.when(
                !(products.isEmpty() || !products.hasContent()),
                () -> Response.ok(products, "Successfully retrieved products"),
                () -> Response.notFound("No products found!")
        );
    }

    public Response<Products> createProduct(CreateProductDTO dto, HttpServletRequest request) {
        UserDTO currentUser = AccessValidation.getCurrentUser(request);
        if (currentUser.getRole() != Role.SELLER) return Response.forbidden("Only sellers can create products");

        Products savedProduct = productsRepository.save(dto.toProducts(currentUser.getId()));
        return Response.created(savedProduct, "Product created successfully");
    }

    private Response<Products> authorizeAndGetProduct(HttpServletRequest request, String id) {
        UserDTO currentUser = AccessValidation.getCurrentUser(request);

        Products product = productsRepository.findById(id).orElse(null);
        if (product == null) return Response.notFound("Product not found!");

        if (!currentUser.getId().equals(product.getUserID()))
            return Response.forbidden("You're not authorized to perform this action.");

        return Response.ok(product);
    }

    public Response<Products> updateProduct(HttpServletRequest request, String id, UpdateProductsDTO updateProductsDTO) {
        Response<Products> authorizationResponse = authorizeAndGetProduct(request, id);
        if (authorizationResponse.isError()) return authorizationResponse;

        Products product = authorizationResponse.getData();

        Response<Products> updateResponse = updateProductsDTO.applyUpdates(product);
        if (updateResponse != null) return updateResponse;

        Products updatedProduct = productsRepository.save(product);
        return Response.ok(updatedProduct, "Product updated successfully");
    }

    public Response<Products> deleteProduct(String id, HttpServletRequest request) {
        Response<Products> authorizationResponse = authorizeAndGetProduct(request, id);
        if (authorizationResponse.isError()) return authorizationResponse;

        Products product = authorizationResponse.getData();
        Response<Object> deletedMediaResponse = mediaServices.deleteMediaRelatedToProduct(List.of(product.getId()));
        if (deletedMediaResponse != null) {
            return Response.mapper(deletedMediaResponse);
        }

        productsRepository.deleteById(id);
        return Response.ok(product, "Product deleted successfully");
    }

    public Response<List<Products>> deleteProductsByUserId(String userId) {
        List<Products> products = productsRepository.findByUserID(userId).orElse(null);
        if (products == null || products.isEmpty()) return Response.notFound("No products found!");

        List<String> ids = products.stream().map(Products::getId).collect(Collectors.toList());

        Response<Object> deletedMediaResponse = mediaServices.deleteMediaRelatedToProduct(ids);
        if (deletedMediaResponse != null) return Response.mapper(deletedMediaResponse);

        productsRepository.deleteAllById(ids);
        return Response.ok(products, "Products deleted successfully");
    }


    public Response<Page<Products>> searchProducts(ProductSearchCriteria searchCriteria) {
        Query query = buildQuery(searchCriteria);

        // Get total count for pagination
        long totalCount = mongoTemplate.count(query, Products.class);
        List<Products> products = mongoTemplate.find(applyPaginationAndSorting(query, searchCriteria), Products.class);

        // Create pageable
        Pageable pageable = PageRequest.of(searchCriteria.getPage(), searchCriteria.getSize());
        var page = new PageImpl<>(products, pageable, totalCount);
        return Response.when(
                !page.hasContent(),
                () -> Response.notFound("No products found!"),
                () -> Response.ok(page)
        );

    }


    private Query buildQuery(ProductSearchCriteria criteria) {
        Query query = new Query();
        List<Criteria> criteriaList = new ArrayList<>();

        // Keyword search (searches in multiple fields)
        if (criteria.getKeyword() != null && !criteria.getKeyword().trim().isEmpty()) {
            String keywordRegex = ".*" + Pattern.quote(criteria.getKeyword()) + ".*";
            Criteria keywordCriteria = new Criteria().orOperator(
                    Criteria.where("name").regex(keywordRegex, "i"),
                    Criteria.where("description").regex(keywordRegex, "i")
            );
            criteriaList.add(keywordCriteria);
        }

        // Name search
        if (criteria.getName() != null && !criteria.getName().trim().isEmpty()) {
            String nameRegex = ".*" + Pattern.quote(criteria.getName()) + ".*";
            criteriaList.add(Criteria.where("name").regex(nameRegex, "i"));
        }

        // Price filters
        if (criteria.getPrice() != null && !criteria.getPrice().trim().isEmpty()) {
            try {
                Double priceValue = Double.parseDouble(criteria.getPrice());
                criteriaList.add(Criteria.where("price").is(priceValue));
            } catch (NumberFormatException e) {
                // Log error or handle invalid price format
            }
        }

        if (criteria.getPriceMin() != null) {
            criteriaList.add(Criteria.where("price").gte(criteria.getPriceMin()));
        }

        if (criteria.getPriceMax() != null) {
            criteriaList.add(Criteria.where("price").lte(criteria.getPriceMax()));
        }

        // Quantity filters
        if (criteria.getQuantity() != null && !criteria.getQuantity().trim().isEmpty()) {
            try {
                Integer quantityValue = Integer.parseInt(criteria.getQuantity());
                criteriaList.add(Criteria.where("quantity").is(quantityValue));
            } catch (NumberFormatException e) {
                // Log error or handle invalid quantity format
            }
        }

        if (criteria.getQuantityMin() != null) {
            criteriaList.add(Criteria.where("quantity").gte(criteria.getQuantityMin()));
        }

        if (criteria.getQuantityMax() != null) {
            criteriaList.add(Criteria.where("quantity").lte(criteria.getQuantityMax()));
        }

        // User IDs filter
        if (criteria.getUserIds() != null && !criteria.getUserIds().isEmpty()) {
            criteriaList.add(Criteria.where("userId").in(criteria.getUserIds()));
        }

        // Category IDs filter
        if (criteria.getCategoryIds() != null && !criteria.getCategoryIds().isEmpty()) {
            criteriaList.add(Criteria.where("categoryId").in(criteria.getCategoryIds()));
        }

        // Tags filter
        if (criteria.getTags() != null && !criteria.getTags().isEmpty()) {
            criteriaList.add(Criteria.where("tags").in(criteria.getTags()));
        }

        // Combine all criteria with AND operation
        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(
                    criteriaList.toArray(new Criteria[0])
            ));
        }

        return query;
    }

    private Query applyPaginationAndSorting(Query query, ProductSearchCriteria criteria) {
        // Apply sorting
        if (criteria.getSortBy() != null && !criteria.getSortBy().trim().isEmpty()) {
            Sort.Direction direction = "desc".equalsIgnoreCase(criteria.getSortOrder())
                    ? Sort.Direction.DESC
                    : Sort.Direction.ASC;
            query.with(Sort.by(direction, criteria.getSortBy()));
        }

        // Apply pagination
        int skip = criteria.getPage() * criteria.getSize();
        query.skip(skip).limit(criteria.getSize());

        return query;
    }
}
