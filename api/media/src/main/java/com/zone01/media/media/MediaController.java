package com.zone01.media.media;

import com.zone01.media.model.Response;
import com.zone01.media.model.dto.MediaDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/media")
public class MediaController {
    private final MediaService mediaService;

    @GetMapping("/{id}/all")
    public ResponseEntity<Response<MediaDTO>> getMediaByIdEvenDeleted(@PathVariable String id) {
        Response<MediaDTO> response = mediaService.getMediaByIdEvenDeleted(id);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Response<MediaDTO>> getMediaById(@PathVariable String id) {
        Response<MediaDTO> response = mediaService.getMediaById(id);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @GetMapping("/{productId}/{imagePath}")
    public ResponseEntity<Object> getMetadataMedia(@PathVariable String productId, @PathVariable String imagePath) {
        Response<Object> response = mediaService.getMetadataMedia(productId, imagePath);
        if (response.isError()) return ResponseEntity.status(response.getStatus()).body(response);

        Resource resource = (Resource) response.getData();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_JPEG);
        headers.setContentDispositionFormData("inline", resource.getFilename());

        return ResponseEntity.status(response.getStatus()).headers(headers).body(resource);
    }

    @GetMapping("/{productId}/{imagePath}/all")
    public ResponseEntity<Object> getMetadataMediaEvenDelete(@PathVariable String productId, @PathVariable String imagePath) {
        Response<Object> response = mediaService.getMetadataMediaEvenDelete(productId, imagePath);
        if (response.isError()) return ResponseEntity.status(response.getStatus()).body(response);

        Resource resource = (Resource) response.getData();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_JPEG);
        headers.setContentDispositionFormData("inline", resource.getFilename());

        return ResponseEntity.status(response.getStatus()).headers(headers).body(resource);
    }

    @GetMapping("/product/{id}")
    public ResponseEntity<Response<List<MediaDTO>>> getMediaByProductId(@PathVariable String id) {
        Response<List<MediaDTO>> response = mediaService.getMediaByProductId(id);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @GetMapping("/product/{id}/all")
    public ResponseEntity<Response<List<MediaDTO>>> getMediaByProductIdEvenDeleted(@PathVariable String id) {
        Response<List<MediaDTO>> response = mediaService.getMediaByProductIdEvenDeleted(id);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @PostMapping("/{product_id}")
    public ResponseEntity<Response<List<MediaDTO>>> createMedia(
            @PathVariable String product_id,
            @RequestParam("files") List<MultipartFile> files,
            HttpServletRequest request
    ) {
        Response<List<MediaDTO>> response = mediaService.createMedia(product_id, files, request);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @PutMapping("/{media_id}")
    public ResponseEntity<Response<MediaDTO>> updateMedia(
            @PathVariable String media_id,
            HttpServletRequest request,
            @RequestParam("files") MultipartFile newFile
            ) {
        Response<MediaDTO> response = mediaService.updateMedia(request, media_id, newFile);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @DeleteMapping("/{media_id}")
    public ResponseEntity<Response<MediaDTO>> deleteProduct(@PathVariable String media_id, HttpServletRequest request) {
        Response<MediaDTO> response = mediaService.deleteMedia(media_id, request);
        return ResponseEntity.status(response.getStatus()).body(response);
    }
}