package com.zone01.media.media;

import com.zone01.media.model.dto.MediaDTO;
import com.zone01.media.model.dto.ProductsDTO;
import com.zone01.media.service.FileServices;
import com.zone01.media.config.kafka.ProductServices;
import com.zone01.media.model.Response;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class MediaService {

    private final MediaRepository mediaRepository;
    private final ProductServices productServices;
    private final FileServices fileServices;

    public Response<MediaDTO> getMediaById(String id) {
        Media media = mediaRepository.findByIdAndDeletedFalse(id).orElse(null);
        if (media == null) return Response.notFound("Media not found!");
        return Response.ok(media.toDTO());
    }

    public Response<MediaDTO> getMediaByIdEvenDeleted(String id) {
        Media media = mediaRepository.findById(id).orElse(null);
        if (media == null) return Response.notFound("Media not found!");
        return Response.ok(media.toDTO());
    }

    public Response<Object> getMetadataMedia(String productId, String imagePath) {
        Media media = mediaRepository.findMediaByProductIdAndImagePathAndDeletedFalse(productId, imagePath).orElse(null);
        if (media == null) return Response.notFound("Media not found!");
        return fileServices.getImages(productId, imagePath);
    }

    public Response<Object> getMetadataMediaEvenDelete(String productId, String imagePath) {
        return fileServices.getImages(productId, imagePath);
    }

    public Response<List<MediaDTO>> getMediaByProductId(String id) {
        List<Media> media = mediaRepository.findMediaByProductIdAndDeletedFalse(id);
        return Response.ok(Media.toDTO(media));
    }

    public Response<List<MediaDTO>> getMediaByProductIdEvenDeleted(String id) {
        List<Media> media = mediaRepository.findMediaByProductId(id);
        return Response.ok(Media.toDTO(media));
    }

    public Response<ProductsDTO> authorization(HttpServletRequest request, String productId) {
        Response<ProductsDTO> productValidationResponse = productServices.getProductByID(productId, request);
        if (productValidationResponse != null && productValidationResponse.isError() || Objects.requireNonNull(productValidationResponse).getData() == null)
            return productValidationResponse;

        ProductsDTO product = productValidationResponse.getData();
        return Response.ok(product);
    }

    public Response<Media> authorizationWhenDeleteAndUpdate(HttpServletRequest request, String mediaId) {
        Optional<Media> existingMedia = mediaRepository.findByIdAndDeletedFalse(mediaId);
        if (existingMedia.isEmpty())
            return Response.notFound("Media not found");

        Media media = existingMedia.get();
        Response<ProductsDTO> response = this.authorization(request, media.getProductId());
        return Response.when(
                response.isError(),
                () -> Response.mapper(response),
                () -> Response.ok(media)
        );
    }

    @Transactional
    public Response<List<MediaDTO>> createMedia(String productId, List<MultipartFile> files, HttpServletRequest request) {
        try {

            Response<Object> mediaValidationResponse = fileServices.validateFiles(files, productId, false);
            if (mediaValidationResponse != null) return Response.mapper(mediaValidationResponse);

            Response<ProductsDTO> authorizationResponse = authorization(request, productId);
            if (authorizationResponse.isError()) return Response.mapper(authorizationResponse);

            long remainingMediaCount = mediaRepository.countByProductIdAndDeletedFalse(productId);
            List<String> savedFilesName = fileServices.saveFiles(files, productId);
            var savedFiles = savedFilesName.stream().map(filename -> {
                Media newMedia = Media.builder()
                        .imagePath(filename)
                        .productId(productId)
                        .build();

                return mediaRepository.save(newMedia).toDTO();
            }).collect(Collectors.toList());

            if (remainingMediaCount == 0 && !savedFiles.isEmpty()) {
                Response<List<ProductsDTO>> response = productServices.markProductAsActive(Collections.singletonMap(productId, true));
                if (response.isError()) return Response.mapper(response);
            }

            return Response.created(savedFiles);
        } catch (Exception e) {
            return Response.badRequest("Media upload failed: " + e.getMessage());
        }
    }

    public Response<MediaDTO> updateMedia(HttpServletRequest request, String mediaId, MultipartFile newFile) {
        try {
            Response<Media> authorizationResponse = authorizationWhenDeleteAndUpdate(request, mediaId);
            if (authorizationResponse.isError()) return Response.mapper(authorizationResponse);

            Media media = authorizationResponse.getData();
            Response<Object> fileValidationResponse = fileServices.validateFiles(newFile, "", true);
            if (fileValidationResponse != null)
                return Response.mapper(fileValidationResponse);


            List<String> newFilename = fileServices.saveFiles(newFile, media.getProductId());
            Response<Object> mediaDeleteResponse= fileServices.deleteOldFile(media.getProductId(), media.getImagePath());
            if (mediaDeleteResponse != null)  return Response.mapper(mediaDeleteResponse);
            media.setImagePath(newFilename.get(0));

            Media updatedMedia = mediaRepository.save(media);
            return Response.ok(updatedMedia.toDTO());
        } catch (Exception e) {
            return Response.badRequest("Media update failed: " + e.getMessage());
        }
    }

    public Response<MediaDTO> deleteMedia(String mediaId, HttpServletRequest request) {
        try {
            Response<Media> authorizationResponse = authorizationWhenDeleteAndUpdate(request, mediaId);
            if (authorizationResponse.isError()) return Response.mapper(authorizationResponse);

            Media media = authorizationResponse.getData();
            media.setDeleted(true);
            mediaRepository.save(media);

            long remainingMediaCount = mediaRepository.countByProductIdAndDeletedFalse(media.getProductId());
            if (remainingMediaCount == 0) {
                Response<List<ProductsDTO>> productUpdateResponse = productServices.markProductAsActive(Collections.singletonMap(media.getProductId(), false));
                if (productUpdateResponse.isError()) return Response.mapper(productUpdateResponse);
            }

            return Response.ok(media.toDTO());
        } catch (Exception e) {
            return Response.badRequest("Media update failed: " + e.getMessage());
        }
    }

    public Response<List<MediaDTO>> deleteMediaByProductIds(List<String> productIds) {
        try {
            if (productIds == null || productIds.isEmpty())
                return Response.badRequest("No product IDs provided");

            List<Media> media = mediaRepository.findByDeletedFalseAndProductIdIn(productIds);
            if (media.isEmpty())
                return Response.ok(Media.toDTO(media),"No media found for the given product IDs.");
            var deletedMedia = media.stream().map(m -> {
                m.setDeleted(true);
                return mediaRepository.save(m).toDTO();
            }).toList();

            return Response.ok(deletedMedia);

        } catch (Exception e) {
            return Response.badRequest("Media deletion failed: " + e.getMessage());
        }
    }
}
