package com.zone01.product.product;

import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(MockitoExtension.class)
class ProductsServiceTest {
//
//    private ProductsRepository productsRepository;
//    private MediaServices mediaServices;
//    private ProductsService productsService;
//    private HttpServletRequest request;
//    private UserDTO testUser;
//    private Products testProduct;
//
//    @BeforeEach
//    void setUp() {
//        productsRepository = mock(ProductsRepository.class);
//        mediaServices = mock(MediaServices.class);
//        request = mock(HttpServletRequest.class);
//
//        productsService = new ProductsService(productsRepository, mediaServices);
//
//        testUser = UserDTO.builder()
//                .id("user123")
//                .name("Test User")
//                .email("test@example.com")
//                .role(Role.CLIENT)
//                .build();
//
//        testProduct = Products.builder()
//                .id("prod123")
//                .name("test product")
//                .price(19.99)
//                .description("test description")
//                .quantity(10)
//                .userID("user123")
//                .build();
//    }
//
//    @Test
//    @DisplayName("Should return all products with pagination")
//    void getAllProducts_Success() {
//        // Arrange
//        List<Products> productsList = Collections.singletonList(testProduct);
//        Page<Products> productsPage = new PageImpl<>(productsList);
//        when(productsRepository.findAll(any(PageRequest.class))).thenReturn(productsPage);
//
//        // Act
//        Page<Products> result = productsService.getAllProducts(0, 10);
//
//        // Assert
//        assertNotNull(result);
//        assertEquals(1, result.getTotalElements());
//        assertEquals(testProduct.getId(), result.getContent().get(0).getId());
//
//        verify(productsRepository).findAll(PageRequest.of(0, 10));
//    }
//
//    @Test
//    @DisplayName("Should return product by ID when it exists")
//    void getProductById_Success() {
//        // Arrange
//        when(productsRepository.findById("prod123")).thenReturn(Optional.of(testProduct));
//
//        // Act
//        Optional<Products> result = productsService.getProductById("prod123");
//
//        // Assert
//        assertTrue(result.isPresent());
//        assertEquals("prod123", result.get().getId());
//
//        verify(productsRepository).findById("prod123");
//    }
//
//    @Test
//    @DisplayName("Should return empty Optional when product ID doesn't exist")
//    void getProductById_NotFound() {
//        // Arrange
//        when(productsRepository.findById("nonexistent")).thenReturn(Optional.empty());
//
//        // Act
//        Optional<Products> result = productsService.getProductById("nonexistent");
//
//        // Assert
//        assertFalse(result.isPresent());
//
//        verify(productsRepository).findById("nonexistent");
//    }
//
//    @Test
//    @DisplayName("Should return products by user ID with pagination")
//    void getProductByUserId_Success() {
//        // Arrange
//        List<Products> productsList = Collections.singletonList(testProduct);
//        Page<Products> productsPage = new PageImpl<>(productsList);
//        when(productsRepository.findProductsByUserID(eq("user123"), any(PageRequest.class))).thenReturn(productsPage);
//
//        // Act
//        Page<Products> result = productsService.getProductByUserId("user123", 0, 10);
//
//        // Assert
//        assertNotNull(result);
//        assertEquals(1, result.getTotalElements());
//        assertEquals("prod123", result.getContent().get(0).getId());
//
//        verify(productsRepository).findProductsByUserID("user123", PageRequest.of(0, 10));
//    }
//
//    @Test
//    @DisplayName("Should create product successfully")
//    void createProduct_Success() {
//        // Arrange
//        CreateProductDTO createProductDTO = CreateProductDTO.builder()
//                .name("New Product")
//                .price(29.99)
//                .description("New product description")
//                .quantity(5)
//                .build();
//
//        Products expectedProduct = Products.builder()
//                .name("new product")
//                .price(29.99)
//                .description("new product description")
//                .quantity(5)
//                .userID("user123")
//                .build();
//
//        when(productsRepository.save(any(Products.class))).thenAnswer(invocation -> {
//            Products savedProduct = invocation.getArgument(0);
//            savedProduct.setId("newprod123");
//            return savedProduct;
//        });
//
//        try (MockedStatic<AccessValidation> mockedAccessValidation = mockStatic(AccessValidation.class)) {
//            mockedAccessValidation.when(() -> AccessValidation.getCurrentUser(request))
//                    .thenReturn(testUser);
//
//            // Act
//            Products result = productsService.createProduct(createProductDTO, request);
//
//            // Assert
//            assertNotNull(result);
//            assertEquals("newprod123", result.getId());
//            assertEquals("new product", result.getName());
//            assertEquals(29.99, result.getPrice());
//            assertEquals("new product description", result.getDescription());
//            assertEquals(5, result.getQuantity());
//            assertEquals("user123", result.getUserID());
//
//            verify(productsRepository).save(any(Products.class));
//        }
//    }
//
//    @Test
//    @DisplayName("Should handle HTML escaping when creating product")
//    void createProduct_WithHtmlContent() {
//        // Arrange
//        CreateProductDTO createProductDTO = CreateProductDTO.builder()
//                .name("<script>alert('xss')</script>Product")
//                .price(29.99)
//                .quantity(5)
//                .description("<b>Bold</b> description")
//                .build();
//
//        when(productsRepository.save(any(Products.class))).thenAnswer(invocation -> {
//            Products savedProduct = invocation.getArgument(0);
//            savedProduct.setId("newprod123");
//            return savedProduct;
//        });
//
//        try (MockedStatic<AccessValidation> mockedAccessValidation = mockStatic(AccessValidation.class)) {
//            mockedAccessValidation.when(() -> AccessValidation.getCurrentUser(request))
//                    .thenReturn(testUser);
//
//            // Act
//            Products result = productsService.createProduct(createProductDTO, request);
//
//            // Assert
//            assertNotNull(result);
//            assertEquals("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;product", result.getName());
//            assertEquals("&lt;b&gt;bold&lt;/b&gt; description", result.getDescription());
//
//            verify(productsRepository).save(any(Products.class));
//        }
//    }
//
//    @Test
//    @DisplayName("Should return product not found when updating nonexistent product")
//    void updateProduct_ProductNotFound() {
//        // Arrange
//        String productId = "nonexistent";
//        UpdateProductsDTO updateProductsDTO = mock(UpdateProductsDTO.class);
//
//        when(productsRepository.findById(productId)).thenReturn(Optional.empty());
//
//        try (MockedStatic<AccessValidation> mockedAccessValidation = mockStatic(AccessValidation.class)) {
//            mockedAccessValidation.when(() -> AccessValidation.getCurrentUser(request))
//                    .thenReturn(testUser);
//
//            // Act
//            Response<Object> result = productsService.updateProduct(request, productId, updateProductsDTO);
//
//            // Assert
//            assertEquals(HttpStatus.NOT_FOUND.value(), result.getStatus());
//            assertEquals("Product not found", result.getMessage());
//            assertNull(result.getData());
//        }
//    }
//
//    @Test
//    @DisplayName("Should deny update when user doesn't own the product")
//    void updateProduct_Unauthorized() {
//        // Arrange
//        String productId = "prod123";
//        UpdateProductsDTO updateProductsDTO = mock(UpdateProductsDTO.class);
//
//        Products otherUserProduct = Products.builder()
//                .id(productId)
//                .name("Other user product")
//                .userID("otheruser456")
//                .build();
//
//        when(productsRepository.findById(productId)).thenReturn(Optional.of(otherUserProduct));
//
//        try (MockedStatic<AccessValidation> mockedAccessValidation = mockStatic(AccessValidation.class)) {
//            mockedAccessValidation.when(() -> AccessValidation.getCurrentUser(request))
//                    .thenReturn(testUser);
//
//            // Act
//            Response<Object> result = productsService.updateProduct(request, productId, updateProductsDTO);
//
//            // Assert
//            assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
//            assertEquals("You're not authorized to perform this action.", result.getMessage());
//            assertNull(result.getData());
//        }
//    }
//
//    @Test
//    @DisplayName("Should handle validation errors when updating product")
//    void updateProduct_ValidationError() {
//        // Arrange
//        String productId = "prod123";
//        UpdateProductsDTO updateProductsDTO = mock(UpdateProductsDTO.class);
//
//        Response<Object> validationError = Response.<Object>builder()
//                .status(HttpStatus.BAD_REQUEST.value())
//                .message("Invalid update data")
//                .build();
//
//        when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
//        when(updateProductsDTO.applyUpdates(any(Products.class))).thenReturn(validationError);
//
//        try (MockedStatic<AccessValidation> mockedAccessValidation = mockStatic(AccessValidation.class)) {
//            mockedAccessValidation.when(() -> AccessValidation.getCurrentUser(request))
//                    .thenReturn(testUser);
//
//            // Act
//            Response<Object> result = productsService.updateProduct(request, productId, updateProductsDTO);
//
//            // Assert
//            assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
//            assertEquals("Invalid update data", result.getMessage());
//
//            verify(productsRepository, never()).save(any(Products.class));
//        }
//    }
//
//    @Test
//    @DisplayName("Should update product successfully")
//    void updateProduct_Success() {
//        // Arrange
//        String productId = "prod123";
//        UpdateProductsDTO updateProductsDTO = mock(UpdateProductsDTO.class);
//
//        Products updatedProduct = Products.builder()
//                .id(productId)
//                .name("updated product")
//                .price(39.99)
//                .description("updated description")
//                .quantity(15)
//                .userID("user123")
//                .build();
//
//        when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
//        when(updateProductsDTO.applyUpdates(any(Products.class))).thenReturn(null);
//        when(productsRepository.save(any(Products.class))).thenReturn(updatedProduct);
//
//        try (MockedStatic<AccessValidation> mockedAccessValidation = mockStatic(AccessValidation.class)) {
//            mockedAccessValidation.when(() -> AccessValidation.getCurrentUser(request))
//                    .thenReturn(testUser);
//
//            // Act
//            Response<Object> result = productsService.updateProduct(request, productId, updateProductsDTO);
//
//            // Assert
//            assertEquals(HttpStatus.OK.value(), result.getStatus());
//            assertEquals("Product updated successfully", result.getMessage());
//            assertNotNull(result.getData());
//            assertEquals(updatedProduct, result.getData());
//
//            verify(productsRepository).save(any(Products.class));
//        }
//    }
//
//    @Test
//    @DisplayName("Should return product not found when deleting nonexistent product")
//    void deleteProduct_ProductNotFound() {
//        // Arrange
//        String productId = "nonexistent";
//
//        when(productsRepository.findById(productId)).thenReturn(Optional.empty());
//
//        try (MockedStatic<AccessValidation> mockedAccessValidation = mockStatic(AccessValidation.class)) {
//            mockedAccessValidation.when(() -> AccessValidation.getCurrentUser(request))
//                    .thenReturn(testUser);
//
//            // Act
//            Response<Object> result = productsService.deleteProduct(productId, request);
//
//            // Assert
//            assertEquals(HttpStatus.NOT_FOUND.value(), result.getStatus());
//            assertEquals("Product not found", result.getMessage());
//            assertNull(result.getData());
//
//            verify(productsRepository, never()).deleteById(anyString());
//        }
//    }
//
//    @Test
//    @DisplayName("Should deny delete when user doesn't own the product")
//    void deleteProduct_Unauthorized() {
//        // Arrange
//        String productId = "prod123";
//
//        Products otherUserProduct = Products.builder()
//                .id(productId)
//                .name("Other user product")
//                .userID("otheruser456")
//                .build();
//
//        when(productsRepository.findById(productId)).thenReturn(Optional.of(otherUserProduct));
//
//        try (MockedStatic<AccessValidation> mockedAccessValidation = mockStatic(AccessValidation.class)) {
//            mockedAccessValidation.when(() -> AccessValidation.getCurrentUser(request))
//                    .thenReturn(testUser);
//
//            // Act
//            Response<Object> result = productsService.deleteProduct(productId, request);
//
//            // Assert
//            assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
//            assertEquals("You're not authorized to perform this action.", result.getMessage());
//            assertNull(result.getData());
//
//            verify(productsRepository, never()).deleteById(anyString());
//        }
//    }
//
//    @Test
//    @DisplayName("Should handle media service errors when deleting product")
//    void deleteProduct_MediaServiceError() {
//        // Arrange
//        String productId = "prod123";
//
//        Response<Object> mediaServiceError = Response.<Object>builder()
//                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
//                .message("Failed to delete related media")
//                .build();
//
//        when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
//        when(mediaServices.deleteMediaRelatedToProduct(Collections.singletonList(productId))).thenReturn(mediaServiceError);
//
//        try (MockedStatic<AccessValidation> mockedAccessValidation = mockStatic(AccessValidation.class)) {
//            mockedAccessValidation.when(() -> AccessValidation.getCurrentUser(request))
//                    .thenReturn(testUser);
//
//            // Act
//            Response<Object> result = productsService.deleteProduct(productId, request);
//
//            // Assert
//            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), result.getStatus());
//            assertEquals("Failed to delete related media", result.getMessage());
//            assertNull(result.getData());
//
//            verify(productsRepository, never()).deleteById(anyString());
//        }
//    }
//
//    @Test
//    @DisplayName("Should delete product successfully")
//    void deleteProduct_Success() {
//        // Arrange
//        String productId = "prod123";
//
//        when(productsRepository.findById(productId)).thenReturn(Optional.of(testProduct));
//        when(mediaServices.deleteMediaRelatedToProduct(Collections.singletonList(productId))).thenReturn(null);
//        doNothing().when(productsRepository).deleteById(productId);
//
//        try (MockedStatic<AccessValidation> mockedAccessValidation = mockStatic(AccessValidation.class)) {
//            mockedAccessValidation.when(() -> AccessValidation.getCurrentUser(request))
//                    .thenReturn(testUser);
//
//            // Act
//            Response<Object> result = productsService.deleteProduct(productId, request);
//
//            // Assert
//            assertEquals(HttpStatus.OK.value(), result.getStatus());
//            assertEquals("Product deleted successfully", result.getMessage());
//            assertNotNull(result.getData());
//            assertEquals(testProduct, result.getData());
//
//            verify(productsRepository).deleteById(productId);
//        }
//    }
//
//    @Test
//    @DisplayName("Should handle empty product list when deleting by user ID")
//    void deleteProductsByUserId_NoProducts() {
//        // Arrange
//        String userId = "user123";
//
//        when(productsRepository.findByUserID(userId)).thenReturn(Optional.empty());
//
//        // Act
//        Response<Object> result = productsService.deleteProductsByUserId(userId);
//
//        // Assert
//        assertEquals(HttpStatus.OK.value(), result.getStatus());
//        assertEquals("Nothing to delete", result.getMessage());
//        assertNull(result.getData());
//
//        verify(productsRepository, never()).deleteAllById(anyList());
//    }
//
//    @Test
//    @DisplayName("Should handle media service errors when deleting products by user ID")
//    void deleteProductsByUserId_MediaServiceError() {
//        // Arrange
//        String userId = "user123";
//        List<Products> userProducts = Collections.singletonList(testProduct);
//
//        Response<Object> mediaServiceError = Response.<Object>builder()
//                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
//                .message("Failed to delete related media")
//                .build();
//
//        when(productsRepository.findByUserID(userId)).thenReturn(Optional.of(userProducts));
//        when(mediaServices.deleteMediaRelatedToProduct(Collections.singletonList("prod123"))).thenReturn(mediaServiceError);
//
//        // Act
//        Response<Object> result = productsService.deleteProductsByUserId(userId);
//
//        // Assert
//        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), result.getStatus());
//        assertEquals("Failed to delete related media", result.getMessage());
//        assertNull(result.getData());
//
//        verify(productsRepository, never()).deleteAllById(anyList());
//    }
//
//    @Test
//    @DisplayName("Should delete all user products successfully")
//    void deleteProductsByUserId_Success() {
//        // Arrange
//        String userId = "user123";
//        List<Products> userProducts = Collections.singletonList(testProduct);
//        List<String> productIds = Collections.singletonList("prod123");
//
//        when(productsRepository.findByUserID(userId)).thenReturn(Optional.of(userProducts));
//        when(mediaServices.deleteMediaRelatedToProduct(productIds)).thenReturn(null);
//        doNothing().when(productsRepository).deleteAllById(productIds);
//
//        // Act
//        Response<Object> result = productsService.deleteProductsByUserId(userId);
//
//        // Assert
//        assertEquals(HttpStatus.OK.value(), result.getStatus());
//        assertEquals("Product deleted successfully", result.getMessage());
//        assertNull(result.getData());
//
//        verify(productsRepository).deleteAllById(productIds);
//    }
}