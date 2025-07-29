package com.zone01.product.product;

import com.mongodb.client.MongoClients;
import com.zone01.product.config.AccessValidation;
import com.zone01.product.config.kafka.MediaServices;
import com.zone01.product.dto.*;
import com.zone01.product.model.Response;
import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;
import org.apache.commons.text.StringEscapeUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductsService {
    private final ProductsRepository productsRepository;
    private final MediaServices mediaServices;
    private final MongoTemplate mongoTemplate;

    public Page<Products> getAllProducts(int page, int size) {
        return productsRepository.findAll(PageRequest.of(page, size));
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

        if (!unavailable.isEmpty()) {
            return Response.<List<Products>>builder()
                    .status(HttpStatus.BAD_REQUEST.value())
                    .message("Some products are unavailable")
                    .data(unavailable)
                    .build();
        }

        return Response.<List<Products>>builder()
                .status(HttpStatus.OK.value())
                .message("All products are available")
                .data(available)
                .build();
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

    public Optional<Products> getProductById(String id) {
        return productsRepository.findById(id);
    }

    public List<Products> getProductById(List<String> id) {
        return productsRepository.findByIdIn(id);
    }

    public Page<Products> getProductByUserId(String id, int page, int size) {
        return productsRepository.findProductsByUserID(id, PageRequest.of(page, size));
    }

    public Products createProduct(CreateProductDTO product, HttpServletRequest request) {
        UserDTO currentUser = AccessValidation.getCurrentUser(request);

        String escapedName = StringEscapeUtils.escapeHtml4(product.getName().toLowerCase()).replace("'", "&#39;");
        String escapedDescription = StringEscapeUtils.escapeHtml4(product.getDescription().toLowerCase()).replace("'", "&#39;");

        Products newProduct = Products
                .builder()
                .name(escapedName)
                .price(product.getPrice())
                .description(escapedDescription)
                .quantity(product.getQuantity())
                .userID(currentUser.getId())
                .build();

        return productsRepository.save(newProduct);
    }

    private Response<Object> authorizeAndGetProduct(HttpServletRequest request, String id) {
        UserDTO currentUser = AccessValidation.getCurrentUser(request);

        Optional<Products> productOptional = productsRepository.findById(id);
        if (productOptional.isEmpty()) {
            return Response.<Object>builder()
                    .status(HttpStatus.NOT_FOUND.value())
                    .data(null)
                    .message("Product not found")
                    .build();
        }

        Products product = productOptional.get();
        if (!currentUser.getId().equals(product.getUserID())) {
            return Response.<Object>builder()
                    .status(HttpStatus.BAD_REQUEST.value())
                    .data(null)
                    .message("You're not authorized to perform this action.")
                    .build();
        }

        return Response.<Object>builder()
                .status(HttpStatus.OK.value())
                .data(productOptional.get())
                .build();
    }

    public Response<Object> updateProduct(HttpServletRequest request, String id, UpdateProductsDTO updateProductsDTO) {
        Response<Object> authorizationResponse = authorizeAndGetProduct(request, id);
        if (authorizationResponse.getStatus() != HttpStatus.OK.value()) {
            return authorizationResponse;
        }

        Products product = (Products) authorizationResponse.getData();

        Response<Object> updateResponse = updateProductsDTO.applyUpdates(product);
        if (updateResponse != null) {return updateResponse;}

        // Save updated product
        Products updatedProduct = productsRepository.save(product);

        // Build and return response
        return Response.<Object>builder()
                .status(HttpStatus.OK.value())
                .data(updatedProduct)
                .message("Product updated successfully")
                .build();
    }

    public Response<Object> deleteProduct(String id, HttpServletRequest request) {
        // Authorize and get the product
        Response<Object> authorizationResponse = authorizeAndGetProduct(request, id);
        if (authorizationResponse.getStatus() != HttpStatus.OK.value()) {
            return authorizationResponse;
        }

        Products product = (Products) authorizationResponse.getData();
        Response<Object> deletedMediaResponse = mediaServices.deleteMediaRelatedToProduct(List.of(product.getId()));
        if (deletedMediaResponse != null) {
            return Response.<Object>builder()
                    .status(deletedMediaResponse.getStatus())
                    .data(null)
                    .message(deletedMediaResponse.getMessage())
                    .build();
        }
        productsRepository.deleteById(id);

        // Return success response
        return Response.<Object>builder()
                .status(HttpStatus.OK.value())
                .data(authorizationResponse.getData())
                .message("Product deleted successfully")
                .build();
    }

    public Response<Object> deleteProductsByUserId(String userId) {
        Optional<List<Products>> productOptional = productsRepository.findByUserID(userId);
        if (productOptional.isEmpty()) {
            return Response.<Object>builder()
                    .status(HttpStatus.OK.value())
                    .data(null)
                    .message("Nothing to delete")
                    .build();
        }

        List<Products> products = productOptional.get();
        List<String> ids = products.stream().map(Products::getId).collect(Collectors.toList());

        Response<Object> deletedMediaResponse = mediaServices.deleteMediaRelatedToProduct(ids);
        if (deletedMediaResponse != null) {
            return Response.<Object>builder()
                    .status(deletedMediaResponse.getStatus())
                    .data(null)
                    .message(deletedMediaResponse.getMessage())
                    .build();
        }

        productsRepository.deleteAllById(ids);

        return Response.<Object>builder()
                .status(HttpStatus.OK.value())
                .data(null)
                .message("Product deleted successfully")
                .build();
    }


    public Page<Products> searchProducts(ProductSearchCriteria searchCriteria) {
        Query query = buildQuery(searchCriteria);

        // Get total count for pagination
        long totalCount = mongoTemplate.count(query, Products.class);
        List<Products> products = mongoTemplate.find(applyPaginationAndSorting(query, searchCriteria), Products.class);

        // Create pageable
        Pageable pageable = PageRequest.of(searchCriteria.getPage(), searchCriteria.getSize());

        // Return page
        return new PageImpl<>(products, pageable, totalCount);

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
