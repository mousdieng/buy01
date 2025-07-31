package com.zone01.media.media;

import com.zone01.media.model.Response;
import com.zone01.media.service.FileServices;
import com.zone01.media.config.kafka.ProductServices;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MediaServiceTest {

    @Mock
    private MediaRepository mediaRepository;

    @Mock
    private ProductServices productServices;

    @Mock
    private FileServices fileServices;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private MediaService mediaService;

    @Captor
    private ArgumentCaptor<Media> mediaCaptor;

    private Media testMedia;
    private final String MEDIA_ID = "media123";
    private final String PRODUCT_ID = "prod123";
    private final String IMAGE_PATH = "image.jpg";

    @BeforeEach
    void setUp() {
        testMedia = Media.builder()
                .id(MEDIA_ID)
                .imagePath(IMAGE_PATH)
                .productId(PRODUCT_ID)
                .build();
    }

    @Test
    @DisplayName("Should return media by ID when it exists")
    void getMediaById_Success() {
        // Arrange
        when(mediaRepository.findById(MEDIA_ID)).thenReturn(Optional.of(testMedia));

        // Act
        Optional<Media> result = mediaService.getMediaById(MEDIA_ID);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(MEDIA_ID, result.get().getId());
        assertEquals(IMAGE_PATH, result.get().getImagePath());
        assertEquals(PRODUCT_ID, result.get().getProductId());

        verify(mediaRepository).findById(MEDIA_ID);
    }

    @Test
    @DisplayName("Should return empty Optional when media ID doesn't exist")
    void getMediaById_NotFound() {
        // Arrange
        String nonExistentId = "nonexistent";
        when(mediaRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act
        Optional<Media> result = mediaService.getMediaById(nonExistentId);

        // Assert
        assertFalse(result.isPresent());
        verify(mediaRepository).findById(nonExistentId);
    }

    @Test
    @DisplayName("Should return metadata for media")
    void getMetadataMedia_Success() {
        // Arrange
        Response<Object> expectedResponse = Response.<Object>builder()
                .status(HttpStatus.OK.value())
                .message("Image retrieved successfully")
                .build();

        when(fileServices.getImages(PRODUCT_ID, IMAGE_PATH)).thenReturn(expectedResponse);

        // Act
        Response<Object> result = mediaService.getMetadataMedia(PRODUCT_ID, IMAGE_PATH);

        // Assert
        assertEquals(HttpStatus.OK.value(), result.getStatus());
        assertEquals("Image retrieved successfully", result.getMessage());

        verify(fileServices).getImages(PRODUCT_ID, IMAGE_PATH);
    }

    @Test
    @DisplayName("Should handle error response from file service when getting metadata")
    void getMetadataMedia_ErrorFromFileService() {
        // Arrange
        Response<Object> errorResponse = Response.<Object>builder()
                .status(HttpStatus.NOT_FOUND.value())
                .message("Image not found")
                .build();

        when(fileServices.getImages(PRODUCT_ID, IMAGE_PATH)).thenReturn(errorResponse);

        // Act
        Response<Object> result = mediaService.getMetadataMedia(PRODUCT_ID, IMAGE_PATH);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND.value(), result.getStatus());
        assertEquals("Image not found", result.getMessage());

        verify(fileServices).getImages(PRODUCT_ID, IMAGE_PATH);
    }

    @Test
    @DisplayName("Should return media list by product ID")
    void getMediaByProductId_Success() {
        // Arrange
        List<Media> expectedMedia = Collections.singletonList(testMedia);
        when(mediaRepository.findMediaByProductId(PRODUCT_ID)).thenReturn(expectedMedia);

        // Act
        List<Media> result = mediaService.getMediaByProductId(PRODUCT_ID);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(MEDIA_ID, result.get(0).getId());

        verify(mediaRepository).findMediaByProductId(PRODUCT_ID);
    }

    @Test
    @DisplayName("Should return empty list when no media exists for product")
    void getMediaByProductId_NoMedia() {
        // Arrange
        when(mediaRepository.findMediaByProductId(PRODUCT_ID)).thenReturn(new ArrayList<>());

        // Act
        List<Media> result = mediaService.getMediaByProductId(PRODUCT_ID);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(mediaRepository).findMediaByProductId(PRODUCT_ID);
    }

    @Test
    @DisplayName("Should handle product validation failure when creating media")
    void createMedia_ProductValidationFailure() throws IOException {
        // Arrange
        List<MultipartFile> files = Collections.singletonList(
                new MockMultipartFile("file1", "test1.jpg", "image/jpeg", "test image".getBytes())
        );

        when(fileServices.validateFiles(eq(files), eq(PRODUCT_ID), eq(false)))
                .thenReturn(null);

        Response<Object> productValidationError = Response.<Object>builder()
                .status(HttpStatus.NOT_FOUND.value())
                .message("Product not found")
                .build();

        when(productServices.getProductByID(PRODUCT_ID, request)).thenReturn(productValidationError);

        // Act
        Response<Object> result = mediaService.createMedia(PRODUCT_ID, files, request);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND.value(), result.getStatus());
        assertEquals("Product not found", result.getMessage());
        assertNull(result.getData());

        verify(fileServices).validateFiles(eq(files), eq(PRODUCT_ID), eq(false));
        verify(fileServices, never()).saveFiles(anyList(), anyString());
        verify(mediaRepository, never()).save(any(Media.class));
    }

    @Test
    @DisplayName("Should handle file validation failure when creating media")
    void createMedia_FileValidationFailure() throws IOException {
        // Arrange
        List<MultipartFile> files = Collections.singletonList(
                new MockMultipartFile("file1", "test1.jpg", "image/jpeg", "test image".getBytes())
        );

        Response<Object> fileValidationError = Response.<Object>builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .message("Invalid file format")
                .build();

        when(fileServices.validateFiles(files, PRODUCT_ID, false)).thenReturn(fileValidationError);

        // Act
        Response<Object> result = mediaService.createMedia(PRODUCT_ID, files, request);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
        assertEquals("Invalid file format", result.getMessage());
        assertNull(result.getData());

        verify(fileServices, never()).saveFiles(anyList(), anyString());
        verify(mediaRepository, never()).save(any(Media.class));
    }

    @Test
    @DisplayName("Should create media successfully")
    void createMedia_Success() throws IOException {
        // Arrange
        List<MultipartFile> files = Collections.singletonList(
                new MockMultipartFile("file1", "test1.jpg", "image/jpeg", "test image".getBytes())
        );
        List<String> savedFileNames = Collections.singletonList("saved-image.jpg");

        when(productServices.getProductByID(PRODUCT_ID, request)).thenReturn(null);
        when(fileServices.validateFiles(files, PRODUCT_ID, false)).thenReturn(null);
        when(fileServices.saveFiles(files, PRODUCT_ID)).thenReturn(savedFileNames);
        when(mediaRepository.save(any(Media.class))).thenReturn(testMedia);

        // Act
        Response<Object> result = mediaService.createMedia(PRODUCT_ID, files, request);

        // Assert
        assertEquals(HttpStatus.CREATED.value(), result.getStatus());
        assertEquals("Media uploaded successfully", result.getMessage());
        assertNotNull(result.getData());
        assertEquals(savedFileNames, result.getData());

        verify(mediaRepository).save(mediaCaptor.capture());
        Media capturedMedia = mediaCaptor.getValue();
        assertEquals(PRODUCT_ID, capturedMedia.getProductId());
        assertEquals("saved-image.jpg", capturedMedia.getImagePath());
    }

    @Test
    @DisplayName("Should handle empty file list when creating media")
    void createMedia_EmptyFileList() throws IOException {
        List<MultipartFile> files = Collections.emptyList();
        Response<Object> expectedResponse = Response.<Object>builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .message("No files provided")
                .data(null)
                .build();

        when(fileServices.validateFiles(eq(files), eq(PRODUCT_ID), eq(false)))
                .thenReturn(expectedResponse);

        Response<Object> result = mediaService.createMedia(PRODUCT_ID, files, request);
        // Assert
        assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
        assertEquals("No files provided", result.getMessage());
        assertNull(result.getData());

        verify(fileServices).validateFiles(eq(files), eq(PRODUCT_ID), eq(false));
        verify(productServices, never()).getProductByID(anyString(), any());
        verify(mediaRepository, never()).save(any(Media.class));
    }

    @Test
    @DisplayName("Should handle exceptions when creating media")
    void createMedia_Exception() throws IOException {
        // Arrange
        List<MultipartFile> files = Collections.singletonList(
                new MockMultipartFile("file1", "test1.jpg", "image/jpeg", "test image".getBytes())
        );

//        when(productServices.getProductByID(PRODUCT_ID, request)).thenReturn(null);
        when(fileServices.validateFiles(files, PRODUCT_ID, false)).thenThrow(new RuntimeException("Unexpected error"));

        // Act
        Response<Object> result = mediaService.createMedia(PRODUCT_ID, files, request);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
        assertEquals("Media upload failed: Unexpected error", result.getMessage());
        assertNull(result.getData());

        verify(mediaRepository, never()).save(any(Media.class));
    }

    @Test
    @DisplayName("Should return not found when updating nonexistent media")
    void updateMedia_MediaNotFound() {
        // Arrange
        String nonExistentId = "nonexistent";
        MultipartFile newFile = new MockMultipartFile("file", "new-image.jpg", "image/jpeg", "new image".getBytes());

        when(mediaRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act
        Response<Object> result = mediaService.updateMedia(request, nonExistentId, newFile);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND.value(), result.getStatus());
        assertEquals("Media not found", result.getMessage());
        assertNull(result.getData());

        verify(fileServices, never()).validateFiles(any(MultipartFile.class), anyString(), anyBoolean());
        verify(mediaRepository, never()).save(any(Media.class));
    }

    @Test
    @DisplayName("Should handle product validation failure when updating media")
    void updateMedia_ProductValidationFailure() {
        // Arrange
        MultipartFile newFile = new MockMultipartFile("file", "new-image.jpg", "image/jpeg", "new image".getBytes());

        when(mediaRepository.findById(MEDIA_ID)).thenReturn(Optional.of(testMedia));

        Response<Object> productValidationError = Response.<Object>builder()
                .status(HttpStatus.FORBIDDEN.value())
                .message("Not authorized to update this product's media")
                .build();

        when(productServices.getProductByID(PRODUCT_ID, request)).thenReturn(productValidationError);

        // Act
        Response<Object> result = mediaService.updateMedia(request, MEDIA_ID, newFile);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN.value(), result.getStatus());
        assertEquals("Not authorized to update this product's media", result.getMessage());
        assertNull(result.getData());

        verify(fileServices, never()).validateFiles(any(MultipartFile.class), anyString(), anyBoolean());
        verify(mediaRepository, never()).save(any(Media.class));
    }

    @Test
    @DisplayName("Should handle file validation failure when updating media")
    void updateMedia_FileValidationFailure() throws IOException {
        // Arrange
        MultipartFile newFile = new MockMultipartFile("file", "new-image.jpg", "image/jpeg", "new image".getBytes());

        when(mediaRepository.findById(MEDIA_ID)).thenReturn(Optional.of(testMedia));
        when(productServices.getProductByID(PRODUCT_ID, request)).thenReturn(null);

        Response<Object> fileValidationError = Response.<Object>builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .message("Invalid file format")
                .build();

        when(fileServices.validateFiles(newFile, "", true)).thenReturn(fileValidationError);

        // Act
        Response<Object> result = mediaService.updateMedia(request, MEDIA_ID, newFile);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
        assertEquals("Invalid file format", result.getMessage());
        assertNull(result.getData());

        verify(fileServices, never()).saveFiles(any(MultipartFile.class), anyString());
        verify(fileServices, never()).deleteOldFile(anyString(), anyString());
        verify(mediaRepository, never()).save(any(Media.class));
    }

    @Test
    @DisplayName("Should update media successfully")
    void updateMedia_Success() throws IOException {
        // Arrange
        MultipartFile newFile = new MockMultipartFile("file", "new-image.jpg", "image/jpeg", "new image".getBytes());
        String updatedImagePath = "updated-image.jpg";

        Media updatedMedia = Media.builder()
                .id(MEDIA_ID)
                .imagePath(updatedImagePath)
                .productId(PRODUCT_ID)
                .build();

        when(mediaRepository.findById(MEDIA_ID)).thenReturn(Optional.of(testMedia));
        when(productServices.getProductByID(PRODUCT_ID, request)).thenReturn(null);
        when(fileServices.validateFiles(newFile, "", true)).thenReturn(null);
        when(fileServices.saveFiles(newFile, PRODUCT_ID)).thenReturn(Collections.singletonList(updatedImagePath));
        when(fileServices.deleteOldFile(PRODUCT_ID, IMAGE_PATH)).thenReturn(null);
        when(mediaRepository.save(any(Media.class))).thenReturn(updatedMedia);

        // Act
        Response<Object> result = mediaService.updateMedia(request, MEDIA_ID, newFile);

        // Assert
        assertEquals(HttpStatus.OK.value(), result.getStatus());
        assertEquals("Media updated successfully", result.getMessage());
        assertNotNull(result.getData());
        assertEquals(updatedImagePath, ((Media) result.getData()).getImagePath());

        verify(fileServices).deleteOldFile(PRODUCT_ID, IMAGE_PATH);
        verify(mediaRepository).save(mediaCaptor.capture());
        Media capturedMedia = mediaCaptor.getValue();
        assertEquals(MEDIA_ID, capturedMedia.getId());
        assertEquals(updatedImagePath, capturedMedia.getImagePath());
    }

    @Test
    @DisplayName("Should handle null file when updating media")
    void updateMedia_NullFile() {
        // Arrange
        when(mediaRepository.findById(MEDIA_ID)).thenReturn(Optional.of(testMedia));
        when(productServices.getProductByID(PRODUCT_ID, request)).thenReturn(
                Response.builder()
                        .status(HttpStatus.OK.value())
                        .message("success")
                        .data(testMedia)
                        .build()
        );
        when(fileServices.validateFiles(null, "", true)).thenReturn(
                Response.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Invalid file format")
                        .data(null)
                        .build()
        );

        // Act
        Response<Object> result = mediaService.updateMedia(request, MEDIA_ID, null);
        System.out.println(result);
        // Assert
        assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
        assertTrue(result.getMessage().contains("Invalid file format"));
        assertNull(result.getData());

        verify(productServices).getProductByID(eq(PRODUCT_ID), eq(request));
        verify(fileServices).validateFiles(eq(null), eq(""), eq(true));
        verify(mediaRepository, never()).save(any(Media.class));
    }

    @Test
    @DisplayName("Should handle old file deletion failure when updating media")
    void updateMedia_DeleteFileFailure() throws IOException {
        // Arrange
        MultipartFile newFile = new MockMultipartFile("file", "new-image.jpg", "image/jpeg", "new image".getBytes());
        String updatedImagePath = "updated-image.jpg";

        when(mediaRepository.findById(MEDIA_ID)).thenReturn(Optional.of(testMedia));
        when(productServices.getProductByID(PRODUCT_ID, request)).thenReturn(null);
        when(fileServices.validateFiles(newFile, "", true)).thenReturn(null);
        when(fileServices.saveFiles(newFile, PRODUCT_ID)).thenReturn(Collections.singletonList(updatedImagePath));

        Response<Object> deleteFileError = Response.<Object>builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .message("File deletion failed")
                .build();

        when(fileServices.deleteOldFile(PRODUCT_ID, IMAGE_PATH)).thenReturn(deleteFileError);

        // Act
        Response<Object> result = mediaService.updateMedia(request, MEDIA_ID, newFile);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), result.getStatus());
        assertEquals("File deletion failed", result.getMessage());
        assertNull(result.getData());

        verify(mediaRepository, never()).save(any(Media.class));
    }

    @Test
    @DisplayName("Should handle exceptions when updating media")
    void updateMedia_Exception() throws IOException {
        // Arrange
        MultipartFile newFile = new MockMultipartFile("file", "new-image.jpg", "image/jpeg", "new image".getBytes());

        when(mediaRepository.findById(MEDIA_ID)).thenReturn(Optional.of(testMedia));
        when(productServices.getProductByID(PRODUCT_ID, request)).thenReturn(null);
        when(fileServices.validateFiles(newFile, "", true)).thenThrow(new RuntimeException("Unexpected error"));

        // Act
        Response<Object> result = mediaService.updateMedia(request, MEDIA_ID, newFile);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
        assertEquals("Media update failed: Unexpected error", result.getMessage());
        assertNull(result.getData());

        verify(fileServices, never()).saveFiles(any(MultipartFile.class), anyString());
        verify(fileServices, never()).deleteOldFile(anyString(), anyString());
        verify(mediaRepository, never()).save(any(Media.class));
    }

    @Test
    @DisplayName("Should return not found when deleting nonexistent media")
    void deleteMedia_MediaNotFound() throws IOException {
        // Arrange
        String nonExistentId = "nonexistent";

        when(mediaRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act
        Response<Object> result = mediaService.deleteMedia(nonExistentId, request);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND.value(), result.getStatus());
        assertEquals("Media not found", result.getMessage());
        assertNull(result.getData());

        verify(fileServices, never()).deleteOldFile(anyString(), anyString());
        verify(mediaRepository, never()).deleteById(anyString());
    }

    @Test
    @DisplayName("Should handle authorization failure when deleting media")
    void deleteMedia_AuthorizationFailure() throws IOException {
        // Arrange
        when(mediaRepository.findById(MEDIA_ID)).thenReturn(Optional.of(testMedia));

        Response<Object> authError = Response.<Object>builder()
                .status(HttpStatus.FORBIDDEN.value())
                .message("Not authorized to delete this media")
                .build();

        when(productServices.getProductByID(PRODUCT_ID, request)).thenReturn(authError);

        // Act
        Response<Object> result = mediaService.deleteMedia(MEDIA_ID, request);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN.value(), result.getStatus());
        assertEquals("Not authorized to delete this media", result.getMessage());
        assertNull(result.getData());

        verify(fileServices, never()).deleteOldFile(anyString(), anyString());
        verify(mediaRepository, never()).deleteById(anyString());
    }

    @Test
    @DisplayName("Should handle file deletion failure when deleting media")
    void deleteMedia_FileDeleteFailure() throws IOException {
        // Arrange
        when(mediaRepository.findById(MEDIA_ID)).thenReturn(Optional.of(testMedia));
        when(productServices.getProductByID(PRODUCT_ID, request)).thenReturn(null);

        Response<Object> fileDeleteError = Response.<Object>builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .message("File deletion failed")
                .build();

        when(fileServices.deleteOldFile(PRODUCT_ID, IMAGE_PATH)).thenReturn(fileDeleteError);

        // Act
        Response<Object> result = mediaService.deleteMedia(MEDIA_ID, request);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), result.getStatus());
        assertEquals("File deletion failed", result.getMessage());
        assertNull(result.getData());

        verify(mediaRepository, never()).deleteById(anyString());
    }

    @Test
    @DisplayName("Should delete media successfully")
    void deleteMedia_Success() throws IOException {
        // Arrange
        when(mediaRepository.findById(MEDIA_ID)).thenReturn(Optional.of(testMedia));
        when(productServices.getProductByID(PRODUCT_ID, request)).thenReturn(null);
        when(fileServices.deleteOldFile(PRODUCT_ID, IMAGE_PATH)).thenReturn(null);
        doNothing().when(mediaRepository).deleteById(MEDIA_ID);

        // Act
        Response<Object> result = mediaService.deleteMedia(MEDIA_ID, request);

        // Assert
        assertEquals(HttpStatus.OK.value(), result.getStatus());
        assertEquals("Media deleted successfully", result.getMessage());
        assertEquals(testMedia, result.getData());

        verify(fileServices).deleteOldFile(PRODUCT_ID, IMAGE_PATH);
        verify(mediaRepository).deleteById(MEDIA_ID);
    }

    @Test
    @DisplayName("Should handle exceptions when deleting media")
    void deleteMedia_Exception() throws IOException {
        // Arrange
        when(mediaRepository.findById(MEDIA_ID)).thenReturn(Optional.of(testMedia));
        when(productServices.getProductByID(PRODUCT_ID, request)).thenReturn(null);
        when(fileServices.deleteOldFile(PRODUCT_ID, IMAGE_PATH)).thenThrow(new RuntimeException("Unexpected error"));

        // Act
        Response<Object> result = mediaService.deleteMedia(MEDIA_ID, request);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
        assertEquals("Media update failed: Unexpected error", result.getMessage());
        assertNull(result.getData());

        verify(mediaRepository, never()).deleteById(anyString());
    }

    @Test
    @DisplayName("Should return success when no media exists for product IDs to delete")
    void deleteMediaByProductIds_NoMedia() throws IOException {
        // Arrange
        List<String> productIds = Arrays.asList("prod123", "prod456");

        when(mediaRepository.findMediaByProductIdIn(productIds)).thenReturn(new ArrayList<>());

        // Act
        Response<Object> result = mediaService.deleteMediaByProductIds(productIds);

        // Assert
        assertEquals(HttpStatus.OK.value(), result.getStatus());
        assertEquals("No media found for the given product IDs.", result.getMessage());
        assertNull(result.getData());

        verify(fileServices, never()).deleteOldFile(anyString(), anyString());
        verify(mediaRepository, never()).deleteAll(anyList());
    }

    @Test
    @DisplayName("Should handle empty product ID list when deleting media by product IDs")
    void deleteMediaByProductIds_EmptyProductIds() throws IOException {
        // Arrange
        List<String> productIds = Collections.emptyList();
        Response<Object> result = mediaService.deleteMediaByProductIds(productIds);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
        assertEquals("No product IDs provided", result.getMessage());
        assertNull(result.getData());

        verify(mediaRepository, never()).findMediaByProductIdIn(anyList());
        verify(fileServices, never()).deleteOldFile(anyString(), anyString());
        verify(mediaRepository, never()).deleteAll(anyList());
    }

    @Test
    @DisplayName("Should handle file deletion failure when deleting media by product IDs")
    void deleteMediaByProductIds_FileDeleteFailure() throws IOException {
        // Arrange
        List<String> productIds = Arrays.asList("prod123", "prod456");
        List<Media> mediaList = Collections.singletonList(testMedia);

        when(mediaRepository.findMediaByProductIdIn(productIds)).thenReturn(mediaList);
        when(fileServices.deleteOldFile(PRODUCT_ID, IMAGE_PATH)).thenThrow(new RuntimeException("File deletion error"));

        // Act
        Response<Object> result = mediaService.deleteMediaByProductIds(productIds);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
        assertEquals("File deletion failed for product ID prod123: File deletion error", result.getMessage());
        assertNull(result.getData());

        verify(mediaRepository, never()).deleteAll(anyList());
    }

    @Test
    @DisplayName("Should delete media by product IDs successfully")
    void deleteMediaByProductIds_Success() throws IOException {
        // Arrange
        List<String> productIds = Arrays.asList("prod123", "prod456");

        Media media1 = Media.builder().id("media123").productId("prod123").imagePath("image1.jpg").build();
        Media media2 = Media.builder().id("media456").productId("prod456").imagePath("image2.jpg").build();
        List<Media> mediaList = Arrays.asList(media1, media2);

        when(mediaRepository.findMediaByProductIdIn(productIds)).thenReturn(mediaList);
        when(fileServices.deleteOldFile(anyString(), anyString())).thenReturn(null);
        doNothing().when(mediaRepository).deleteAll(mediaList);

        // Act
        Response<Object> result = mediaService.deleteMediaByProductIds(productIds);

        // Assert
        assertEquals(HttpStatus.OK.value(), result.getStatus());
        assertEquals("All media for the provided product IDs deleted successfully.", result.getMessage());
        assertNull(result.getData());

        verify(fileServices).deleteOldFile("prod123", "image1.jpg");
        verify(fileServices).deleteOldFile("prod456", "image2.jpg");
        verify(mediaRepository).deleteAll(mediaList);
    }

    @Test
    @DisplayName("Should handle exceptions when deleting media by product IDs")
    void deleteMediaByProductIds_Exception() throws IOException {
        // Arrange
        List<String> productIds = Arrays.asList("prod123", "prod456");

        when(mediaRepository.findMediaByProductIdIn(productIds)).thenThrow(new RuntimeException("Database error"));

        // Act
        Response<Object> result = mediaService.deleteMediaByProductIds(productIds);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), result.getStatus());
        assertEquals("Media deletion failed: Database error", result.getMessage());
        assertNull(result.getData());

        verify(fileServices, never()).deleteOldFile(anyString(), anyString());
        verify(mediaRepository, never()).deleteAll(anyList());
    }
}





//package com.zone01.media.media;
//
//import com.zone01.media.dto.ProductsDTO;
//import com.zone01.media.dto.UserDTO;
//import com.zone01.media.model.Response;
//import com.zone01.media.service.FileServices;
//import com.zone01.media.config.kafka.ProductServices;
//import jakarta.servlet.http.HttpServletRequest;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.DisplayName;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.junit.jupiter.MockitoExtension;
//import org.springframework.http.HttpStatus;
//import org.springframework.mock.web.MockMultipartFile;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.io.IOException;
//import java.util.ArrayList;
//import java.util.Arrays;
//import java.util.List;
//import java.util.Optional;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.ArgumentMatchers.*;
//import static org.mockito.Mockito.*;
//
//@ExtendWith(MockitoExtension.class)
//class MediaServiceTest {
//    private MediaRepository mediaRepository;
//    private ProductServices productServices;
//    private FileServices fileServices;
//    private MediaService mediaService;
//    private HttpServletRequest request;
//
//    private Media testMedia;
//
//    @BeforeEach
//    void setUp() {
//        mediaRepository = mock(MediaRepository.class);
//        productServices = mock(ProductServices.class);
//        fileServices = mock(FileServices.class);
//        request = mock(HttpServletRequest.class);
//
//        mediaService = new MediaService(mediaRepository, productServices, fileServices);
//
//        testMedia = Media.builder()
//                .id("media123")
//                .imagePath("image.jpg")
//                .productId("prod123")
//                .build();
//    }
//
//    @Test
//    @DisplayName("Should return media by ID when it exists")
//    void getMediaById_Success() {
//        // Arrange
//        when(mediaRepository.findById("media123")).thenReturn(Optional.of(testMedia));
//
//        // Act
//        Optional<Media> result = mediaService.getMediaById("media123");
//
//        // Assert
//        assertTrue(result.isPresent());
//        assertEquals("media123", result.get().getId());
//        assertEquals("image.jpg", result.get().getImagePath());
//        assertEquals("prod123", result.get().getProductId());
//
//        verify(mediaRepository).findById("media123");
//    }
//
//    @Test
//    @DisplayName("Should return empty Optional when media ID doesn't exist")
//    void getMediaById_NotFound() {
//        // Arrange
//        when(mediaRepository.findById("nonexistent")).thenReturn(Optional.empty());
//
//        // Act
//        Optional<Media> result = mediaService.getMediaById("nonexistent");
//
//        // Assert
//        assertFalse(result.isPresent());
//
//        verify(mediaRepository).findById("nonexistent");
//    }
//
//    @Test
//    @DisplayName("Should return metadata for media")
//    void getMetadataMedia_Success() {
//        // Arrange
//        Response<Object> expectedResponse = Response.<Object>builder()
//                .status(HttpStatus.OK.value())
//                .message("Image retrieved successfully")
//                .build();
//
//        when(fileServices.getImages("prod123", "image.jpg")).thenReturn(expectedResponse);
//
//        // Act
//        Response<Object> result = mediaService.getMetadataMedia("prod123", "image.jpg");
//
//        // Assert
//        assertEquals(HttpStatus.OK.value(), result.getStatus());
//        assertEquals("Image retrieved successfully", result.getMessage());
//
//        verify(fileServices).getImages("prod123", "image.jpg");
//    }
//
//    @Test
//    @DisplayName("Should return media list by product ID")
//    void getMediaByProductId_Success() {
//        // Arrange
//        List<Media> expectedMedia = Arrays.asList(testMedia);
//        when(mediaRepository.findMediaByProductId("prod123")).thenReturn(expectedMedia);
//
//        // Act
//        List<Media> result = mediaService.getMediaByProductId("prod123");
//
//        // Assert
//        assertNotNull(result);
//        assertEquals(1, result.size());
//        assertEquals("media123", result.get(0).getId());
//
//        verify(mediaRepository).findMediaByProductId("prod123");
//    }
//
//    @Test
//    @DisplayName("Should return empty list when no media exists for product")
//    void getMediaByProductId_NoMedia() {
//        // Arrange
//        when(mediaRepository.findMediaByProductId("prod123")).thenReturn(new ArrayList<>());
//
//        // Act
//        List<Media> result = mediaService.getMediaByProductId("prod123");
//
//        // Assert
//        assertNotNull(result);
//        assertTrue(result.isEmpty());
//
//        verify(mediaRepository).findMediaByProductId("prod123");
//    }
//
//    @Test
//    @DisplayName("Should handle product validation failure when creating media")
//    void createMedia_ProductValidationFailure() throws IOException {
//        // Arrange
//        String productId = "prod123";
//        List<MultipartFile> files = Arrays.asList(
//                new MockMultipartFile("file1", "test1.jpg", "image/jpeg", "test image".getBytes())
//        );
//
//        Response<Object> productValidationError = Response.<Object>builder()
//                .status(HttpStatus.NOT_FOUND.value())
//                .message("Product not found")
//                .data(null)
//                .build();
//
//        when(productServices.getProductByID(productId, request)).thenReturn(productValidationError);
//
//        // Act
//        Response<Object> result = mediaService.createMedia(productId, files, request);
//
//        // Assert
//        assertEquals(HttpStatus.NOT_FOUND.value(), result.getStatus());
//        assertEquals("Product not found", result.getMessage());
//        assertNull(result.getData());
//
//        verify(fileServices, never()).validateFiles(anyList(), anyString(), anyBoolean());
//        verify(fileServices, never()).saveFiles(anyList(), anyString());
//        verify(mediaRepository, never()).save(any(Media.class));
//    }
//
//    @Test
//    @DisplayName("Should handle file validation failure when creating media")
//    void createMedia_FileValidationFailure() throws IOException {
//        // Arrange
//        String productId = "prod123";
//        List<MultipartFile> files = Arrays.asList(
//                new MockMultipartFile("file1", "test1.jpg", "image/jpeg", "test image".getBytes())
//        );
//
//        Response<Object> productResponse = Response.<Object>builder()
//                .status(HttpStatus.OK.value())
//                .data(new ProductsDTO())
//                .build();
//
//        Response<Object> fileValidationError = Response.<Object>builder()
//                .status(HttpStatus.BAD_REQUEST.value())
//                .message("Invalid file format")
//                .data(null)
//                .build();
//
//        when(productServices.getProductByID(productId, request)).thenReturn(productResponse);
//        when(fileServices.validateFiles(files, productId, false)).thenReturn(fileValidationError);
//
//        // Act
//        Response<Object> result = mediaService.createMedia(productId, files, request);
//
//        // Assert
//        assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
//        assertEquals("Invalid file format", result.getMessage());
//        assertNull(result.getData());
//
//        verify(fileServices, never()).saveFiles(anyList(), anyString());
//        verify(mediaRepository, never()).save(any(Media.class));
//    }
//
//    @Test
//    @DisplayName("Should create media successfully")
//    void createMedia_Success() throws IOException {
//        // Arrange
//        String productId = "prod123";
//        List<MultipartFile> files = Arrays.asList(
//                new MockMultipartFile("file1", "test1.jpg", "image/jpeg", "test image".getBytes())
//        );
//
//        Response<Object> productResponse = Response.<Object>builder()
//                .status(HttpStatus.OK.value())
//                .data(new ProductsDTO())
//                .build();
//
//        List<String> savedFileNames = Arrays.asList("saved-image.jpg");
//
//        when(productServices.getProductByID(productId, request)).thenReturn(null);
//        when(fileServices.validateFiles(files, productId, false)).thenReturn(null);
//        when(fileServices.saveFiles(files, productId)).thenReturn(savedFileNames);
//        when(mediaRepository.save(any(Media.class))).thenReturn(testMedia);
//
//        // Act
//        Response<Object> result = mediaService.createMedia(productId, files, request);
//
//        // Assert
//        assertEquals(HttpStatus.CREATED.value(), result.getStatus());
//        assertEquals("Media uploaded successfully", result.getMessage());
//        assertNotNull(result.getData());
//        assertEquals(savedFileNames, result.getData());
//
//        verify(mediaRepository).save(any(Media.class));
//    }
//
//    @Test
//    @DisplayName("Should handle exceptions when creating media")
//    void createMedia_Exception() {
//        // Arrange
//        String productId = "prod123";
//        List<MultipartFile> files = Arrays.asList(
//                new MockMultipartFile("file1", "test1.jpg", "image/jpeg", "test image".getBytes())
//        );
//
//        when(productServices.getProductByID(productId, request)).thenReturn(null);
//        when(fileServices.validateFiles(files, productId, false)).thenThrow(new RuntimeException("Unexpected error"));
//
//        // Act
//        Response<Object> result = mediaService.createMedia(productId, files, request);
//
//        // Assert
//        assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
//        assertEquals("Media upload failed: Unexpected error", result.getMessage());
//        assertNull(result.getData());
//
//        verify(mediaRepository, never()).save(any(Media.class));
//    }
//
//    @Test
//    @DisplayName("Should return not found when updating nonexistent media")
//    void updateMedia_MediaNotFound() {
//        // Arrange
//        String mediaId = "nonexistent";
//        MultipartFile newFile = new MockMultipartFile("file", "new-image.jpg", "image/jpeg", "new image".getBytes());
//
//        when(mediaRepository.findById(mediaId)).thenReturn(Optional.empty());
//
//        // Act
//        Response<Object> result = mediaService.updateMedia(request, mediaId, newFile);
//
//        // Assert
//        assertEquals(HttpStatus.NOT_FOUND.value(), result.getStatus());
//        assertEquals("Media not found", result.getMessage());
//        assertNull(result.getData());
//
//        verify(fileServices, never()).validateFiles(any(MultipartFile.class), anyString(), anyBoolean());
//        verify(mediaRepository, never()).save(any(Media.class));
//    }
//
//    @Test
//    @DisplayName("Should handle file validation failure when updating media")
//    void updateMedia_FileValidationFailure() throws IOException {
//        // Arrange
//        String mediaId = "media123";
//        MultipartFile newFile = new MockMultipartFile("file", "new-image.jpg", "image/jpeg", "new image".getBytes());
//
//        when(mediaRepository.findById(mediaId)).thenReturn(Optional.of(testMedia));
//        when(productServices.getProductByID(testMedia.getProductId(), request)).thenReturn(null);
//
//        Response<Object> fileValidationError = Response.<Object>builder()
//                .status(HttpStatus.BAD_REQUEST.value())
//                .message("Invalid file format")
//                .data(null)
//                .build();
//
//        when(fileServices.validateFiles(newFile, "", true)).thenReturn(fileValidationError);
//
//        // Act
//        Response<Object> result = mediaService.updateMedia(request, mediaId, newFile);
//
//        // Assert
//        assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
//        assertEquals("Invalid file format", result.getMessage());
//        assertNull(result.getData());
//
//        verify(fileServices, never()).saveFiles(any(MultipartFile.class), anyString());
//        verify(fileServices, never()).deleteOldFile(anyString(), anyString());
//        verify(mediaRepository, never()).save(any(Media.class));
//    }
//
//    @Test
//    @DisplayName("Should update media successfully")
//    void updateMedia_Success() throws IOException {
//        // Arrange
//        String mediaId = "media123";
//        MultipartFile newFile = new MockMultipartFile("file", "new-image.jpg", "image/jpeg", "new image".getBytes());
//
//        when(mediaRepository.findById(mediaId)).thenReturn(Optional.of(testMedia));
//        when(productServices.getProductByID(testMedia.getProductId(), request)).thenReturn(null);
//        when(fileServices.validateFiles(newFile, "", true)).thenReturn(null);
//
//        List<String> newFilenames = Arrays.asList("updated-image.jpg");
//        when(fileServices.saveFiles(newFile, testMedia.getProductId())).thenReturn(newFilenames);
//        when(fileServices.deleteOldFile(testMedia.getProductId(), testMedia.getImagePath())).thenReturn(null);
//
//        Media updatedMedia = Media.builder()
//                .id("media123")
//                .imagePath("updated-image.jpg")
//                .productId("prod123")
//                .build();
//
//        when(mediaRepository.save(any(Media.class))).thenReturn(updatedMedia);
//
//        // Act
//        Response<Object> result = mediaService.updateMedia(request, mediaId, newFile);
//
//        // Assert
//        assertEquals(HttpStatus.OK.value(), result.getStatus());
//        assertEquals("Media updated successfully", result.getMessage());
//        assertNotNull(result.getData());
//        assertEquals("updated-image.jpg", ((Media) result.getData()).getImagePath());
//
//        verify(fileServices).deleteOldFile(testMedia.getProductId(), testMedia.getImagePath());
//        verify(mediaRepository).save(any(Media.class));
//    }
//
//    @Test
//    @DisplayName("Should handle old file deletion failure when updating media")
//    void updateMedia_DeleteFileFailure() throws IOException {
//        // Arrange
//        String mediaId = "media123";
//        MultipartFile newFile = new MockMultipartFile("file", "new-image.jpg", "image/jpeg", "new image".getBytes());
//
//        when(mediaRepository.findById(mediaId)).thenReturn(Optional.of(testMedia));
//        when(productServices.getProductByID(testMedia.getProductId(), request)).thenReturn(null);
//        when(fileServices.validateFiles(newFile, "", true)).thenReturn(null);
//
//        List<String> newFilenames = Arrays.asList("updated-image.jpg");
//        when(fileServices.saveFiles(newFile, testMedia.getProductId())).thenReturn(newFilenames);
//
//        Response<Object> deleteFileError = Response.<Object>builder()
//                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
//                .message("File deletion failed")
//                .data(null)
//                .build();
//
//        when(fileServices.deleteOldFile(testMedia.getProductId(), testMedia.getImagePath())).thenReturn(deleteFileError);
//
//        // Act
//        Response<Object> result = mediaService.updateMedia(request, mediaId, newFile);
//
//        // Assert
//        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), result.getStatus());
//        assertEquals("File deletion failed", result.getMessage());
//        assertNull(result.getData());
//
//        verify(mediaRepository, never()).save(any(Media.class));
//    }
//
//    @Test
//    @DisplayName("Should handle exceptions when updating media")
//    void updateMedia_Exception() throws IOException {
//        // Arrange
//        String mediaId = "media123";
//        MultipartFile newFile = new MockMultipartFile("file", "new-image.jpg", "image/jpeg", "new image".getBytes());
//
//        when(mediaRepository.findById(mediaId)).thenReturn(Optional.of(testMedia));
//        when(productServices.getProductByID(testMedia.getProductId(), request)).thenReturn(null);
//        when(fileServices.validateFiles(newFile, "", true)).thenThrow(new RuntimeException("Unexpected error"));
//
//        // Act
//        Response<Object> result = mediaService.updateMedia(request, mediaId, newFile);
//
//        // Assert
//        assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
//        assertEquals("Media update failed: Unexpected error", result.getMessage());
//        assertNull(result.getData());
//
//        verify(fileServices, never()).saveFiles(any(MultipartFile.class), anyString());
//        verify(fileServices, never()).deleteOldFile(anyString(), anyString());
//        verify(mediaRepository, never()).save(any(Media.class));
//    }
//
//    @Test
//    @DisplayName("Should return not found when deleting nonexistent media")
//    void deleteMedia_MediaNotFound() throws IOException {
//        // Arrange
//        String mediaId = "nonexistent";
//
//        when(mediaRepository.findById(mediaId)).thenReturn(Optional.empty());
//
//        // Act
//        Response<Object> result = mediaService.deleteMedia(mediaId, request);
//
//        // Assert
//        assertEquals(HttpStatus.NOT_FOUND.value(), result.getStatus());
//        assertEquals("Media not found", result.getMessage());
//        assertNull(result.getData());
//
//        verify(fileServices, never()).deleteOldFile(anyString(), anyString());
//        verify(mediaRepository, never()).deleteById(anyString());
//    }
//
//    @Test
//    @DisplayName("Should handle authorization failure when deleting media")
//    void deleteMedia_AuthorizationFailure() throws IOException {
//        // Arrange
//        String mediaId = "media123";
//
//        when(mediaRepository.findById(mediaId)).thenReturn(Optional.of(testMedia));
//
//        Response<Object> authError = Response.<Object>builder()
//                .status(HttpStatus.FORBIDDEN.value())
//                .message("Not authorized to delete this media")
//                .data(null)
//                .build();
//
//        when(productServices.getProductByID(testMedia.getProductId(), request)).thenReturn(authError);
//
//        // Act
//        Response<Object> result = mediaService.deleteMedia(mediaId, request);
//
//        // Assert
//        assertEquals(HttpStatus.FORBIDDEN.value(), result.getStatus());
//        assertEquals("Not authorized to delete this media", result.getMessage());
//        assertNull(result.getData());
//
//        verify(fileServices, never()).deleteOldFile(anyString(), anyString());
//        verify(mediaRepository, never()).deleteById(anyString());
//    }
//
//    @Test
//    @DisplayName("Should handle file deletion failure when deleting media")
//    void deleteMedia_FileDeleteFailure() throws IOException {
//        // Arrange
//        String mediaId = "media123";
//
//        when(mediaRepository.findById(mediaId)).thenReturn(Optional.of(testMedia));
//        when(productServices.getProductByID(testMedia.getProductId(), request)).thenReturn(null);
//
//        Response<Object> fileDeleteError = Response.<Object>builder()
//                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
//                .message("File deletion failed")
//                .data(null)
//                .build();
//
//        when(fileServices.deleteOldFile(testMedia.getProductId(), testMedia.getImagePath())).thenReturn(fileDeleteError);
//
//        // Act
//        Response<Object> result = mediaService.deleteMedia(mediaId, request);
//
//        // Assert
//        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), result.getStatus());
//        assertEquals("File deletion failed", result.getMessage());
//        assertNull(result.getData());
//
//        verify(mediaRepository, never()).deleteById(anyString());
//    }
//
//    @Test
//    @DisplayName("Should delete media successfully")
//    void deleteMedia_Success() throws IOException {
//        // Arrange
//        String mediaId = "media123";
//
//        when(mediaRepository.findById(mediaId)).thenReturn(Optional.of(testMedia));
//        when(productServices.getProductByID(testMedia.getProductId(), request)).thenReturn(null);
//        when(fileServices.deleteOldFile(testMedia.getProductId(), testMedia.getImagePath())).thenReturn(null);
//        doNothing().when(mediaRepository).deleteById(mediaId);
//
//        // Act
//        Response<Object> result = mediaService.deleteMedia(mediaId, request);
//
//        // Assert
//        assertEquals(HttpStatus.OK.value(), result.getStatus());
//        assertEquals("Media deleted successfully", result.getMessage());
//        assertEquals(testMedia, result.getData());
//
//        verify(fileServices).deleteOldFile(testMedia.getProductId(), testMedia.getImagePath());
//        verify(mediaRepository).deleteById(mediaId);
//    }
//
//    @Test
//    @DisplayName("Should handle exceptions when deleting media")
//    void deleteMedia_Exception() throws IOException {
//        // Arrange
//        String mediaId = "media123";
//
//        when(mediaRepository.findById(mediaId)).thenReturn(Optional.of(testMedia));
//        when(productServices.getProductByID(testMedia.getProductId(), request)).thenReturn(null);
//        when(fileServices.deleteOldFile(testMedia.getProductId(), testMedia.getImagePath())).thenThrow(new RuntimeException("Unexpected error"));
//
//        // Act
//        Response<Object> result = mediaService.deleteMedia(mediaId, request);
//
//        // Assert
//        assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
//        assertEquals("Media update failed: Unexpected error", result.getMessage());
//        assertNull(result.getData());
//
//        verify(mediaRepository, never()).deleteById(anyString());
//    }
//
//    @Test
//    @DisplayName("Should return success when no media exists for product IDs to delete")
//    void deleteMediaByProductIds_NoMedia() throws IOException {
//        // Arrange
//        List<String> productIds = Arrays.asList("prod123", "prod456");
//
//        when(mediaRepository.findMediaByProductIdIn(productIds)).thenReturn(new ArrayList<>());
//
//        // Act
//        Response<Object> result = mediaService.deleteMediaByProductIds(productIds);
//
//        // Assert
//        assertEquals(HttpStatus.OK.value(), result.getStatus());
//        assertEquals("No media found for the given product IDs.", result.getMessage());
//        assertNull(result.getData());
//
//        verify(fileServices, never()).deleteOldFile(anyString(), anyString());
//        verify(mediaRepository, never()).deleteAll(anyList());
//    }
//
//    @Test
//    @DisplayName("Should handle file deletion failure when deleting media by product IDs")
//    void deleteMediaByProductIds_FileDeleteFailure() throws IOException {
//        // Arrange
//        List<String> productIds = Arrays.asList("prod123", "prod456");
//        List<Media> mediaList = Arrays.asList(testMedia);
//
//        when(mediaRepository.findMediaByProductIdIn(productIds)).thenReturn(mediaList);
//        when(fileServices.deleteOldFile(testMedia.getProductId(), testMedia.getImagePath())).thenThrow(new RuntimeException("File deletion error"));
//
//        // Act
//        Response<Object> result = mediaService.deleteMediaByProductIds(productIds);
//
//        // Assert
//        assertEquals(HttpStatus.BAD_REQUEST.value(), result.getStatus());
//        assertEquals("File deletion failed for product ID prod123: File deletion error", result.getMessage());
//        assertNull(result.getData());
//
//        verify(mediaRepository, never()).deleteAll(anyList());
//    }
//
//    @Test
//    @DisplayName("Should delete media by product IDs successfully")
//    void deleteMediaByProductIds_Success() throws IOException {
//        // Arrange
//        List<String> productIds = Arrays.asList("prod123", "prod456");
//
//        Media media1 = Media.builder().id("media123").productId("prod123").imagePath("image1.jpg").build();
//        Media media2 = Media.builder().id("media456").productId("prod456").imagePath("image2.jpg").build();
//        List<Media> mediaList = Arrays.asList(media1, media2);
//
//        when(mediaRepository.findMediaByProductIdIn(productIds)).thenReturn(mediaList);
//        when(fileServices.deleteOldFile(anyString(), anyString())).thenReturn(null);
//        doNothing().when(mediaRepository).deleteAll(mediaList);
//
//        // Act
//        Response<Object> result = mediaService.deleteMediaByProductIds(productIds);
//
//        // Assert
//        assertEquals(HttpStatus.OK.value(), result.getStatus());
//        assertEquals("All media for the provided product IDs deleted successfully.", result.getMessage());
//        assertNull(result.getData());
//
//        verify(fileServices).deleteOldFile("prod123", "image1.jpg");
//        verify(fileServices).deleteOldFile("prod456", "image2.jpg");
//        verify(mediaRepository).deleteAll(mediaList);
//    }
//
//    @Test
//    @DisplayName("Should handle exceptions when deleting media by product IDs")
//    void deleteMediaByProductIds_Exception() throws IOException {
//        // Arrange
//        List<String> productIds = Arrays.asList("prod123", "prod456");
//
//        when(mediaRepository.findMediaByProductIdIn(productIds)).thenThrow(new RuntimeException("Database error"));
//
//        // Act
//        Response<Object> result = mediaService.deleteMediaByProductIds(productIds);
//
//        // Assert
//        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR.value(), result.getStatus());
//        assertEquals("Media deletion failed: Database error", result.getMessage());
//        assertNull(result.getData());
//
//        verify(fileServices, never()).deleteOldFile(anyString(), anyString());
//        verify(mediaRepository, never()).deleteAll(anyList());
//    }
//}