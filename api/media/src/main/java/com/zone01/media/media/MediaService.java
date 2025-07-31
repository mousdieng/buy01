package com.zone01.media.media;

import com.zone01.media.config.kafka.AccessValidation;
import com.zone01.media.model.Role;
import com.zone01.media.model.dto.ProductsDTO;
import com.zone01.media.model.dto.UserDTO;
import com.zone01.media.service.FileServices;
import com.zone01.media.config.kafka.ProductServices;
import com.zone01.media.model.Response;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class MediaService {

    private final MediaRepository mediaRepository;
    private final ProductServices productServices;
    private final FileServices fileServices;

    public Response<Media> getMediaById(String id) {
        Media media = mediaRepository.findById(id).orElse(null);
        return Response.when(
                media != null,
                () -> Response.ok(media),
                () -> Response.notFound("Media not found!")
        );
    }

    public Response<Object> getMetadataMedia(String productId, String imagePath) {
        return fileServices.getImages(productId, imagePath);
    }

    public Response<List<Media>> getMediaByProductId(String id) {
        List<Media> media = mediaRepository.findMediaByProductId(id);
        return Response.ok(media);
    }

    public Response<ProductsDTO> authorization(HttpServletRequest request, String productId) {
        Response<ProductsDTO> productValidationResponse = productServices.getProductByID(productId, request);
        if (productValidationResponse != null && productValidationResponse.isError() || Objects.requireNonNull(productValidationResponse).getData() == null)
            return productValidationResponse;

        ProductsDTO product = productValidationResponse.getData();
        return Response.ok(product);
    }

    public Response<Media> authorizationWhenDeleteAndUpdate(HttpServletRequest request, String mediaId) {
        Optional<Media> existingMedia = mediaRepository.findById(mediaId);
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


    public Response<List<Media>> createMedia(String productId, List<MultipartFile> files, HttpServletRequest request) {
        try {

            Response<Object> mediaValidationResponse = fileServices.validateFiles(files, productId, false);
            if (mediaValidationResponse != null) return Response.mapper(mediaValidationResponse);

            Response<ProductsDTO> authorizationResponse = authorization(request, productId);
            if (authorizationResponse.isError()) return Response.mapper(authorizationResponse);

            List<String> savedFilesName = fileServices.saveFiles(files, productId);
            var savedFiles = savedFilesName.stream().map(filename -> {
                Media newMedia = Media.builder()
                        .imagePath(filename)
                        .productId(productId)
                        .build();

                return mediaRepository.save(newMedia);
            }).collect(Collectors.toList());

            return Response.created(savedFiles);

        } catch (Exception e) {
            return Response.badRequest("Media upload failed: " + e.getMessage());
        }
    }

    public Response<Media> updateMedia(HttpServletRequest request, String mediaId, MultipartFile newFile) {
        try {
            Response<Media> authorizationResponse = authorizationWhenDeleteAndUpdate(request, mediaId);
            if (authorizationResponse.isError()) return authorizationResponse;

            Media media = authorizationResponse.getData();
            Response<Object> fileValidationResponse = fileServices.validateFiles(newFile, "", true);
            if (fileValidationResponse != null)
                return Response.mapper(fileValidationResponse);


            List<String> newFilename = fileServices.saveFiles(newFile, media.getProductId());
            Response<Object> mediaDeleteResponse= fileServices.deleteOldFile(media.getProductId(), media.getImagePath());
            if (mediaDeleteResponse != null)  return Response.mapper(mediaDeleteResponse);
            media.setImagePath(newFilename.get(0));

            Media updatedMedia = mediaRepository.save(media);
            return Response.ok(updatedMedia);

        } catch (Exception e) {
            return Response.badRequest("Media update failed: " + e.getMessage());
        }
    }

    public Response<Media> deleteMedia(String mediaId, HttpServletRequest request) {
        try {
            Response<Media> authorizationResponse = authorizationWhenDeleteAndUpdate(request, mediaId);
            if (authorizationResponse.isError()) return authorizationResponse;

            Media media = authorizationResponse.getData();

            Response<Object> deleteResponse = fileServices.deleteOldFile(media.getProductId(), media.getImagePath());
            if (deleteResponse != null) return Response.mapper(deleteResponse);
            mediaRepository.deleteById(media.getId());

            return Response.ok(media);
        } catch (Exception e) {
            return Response.badRequest("Media update failed: " + e.getMessage());
        }
    }

    public Response<List<Media>> deleteMediaByProductIds(List<String> productIds) {
        try {
            if (productIds == null || productIds.isEmpty())
                return Response.badRequest("No product IDs provided");

            List<Media> mediaToDelete = mediaRepository.findMediaByProductIdIn(productIds);
            if (mediaToDelete.isEmpty())
                return Response.ok(mediaToDelete,"No media found for the given product IDs.");

            for (Media media : mediaToDelete) {
                try {
                    fileServices.deleteOldFile(media.getProductId(), media.getImagePath());
                } catch (Exception e) {
                    return Response.badRequest("File deletion failed for product ID " + media.getProductId() + ": " + e.getMessage());
                }
            }

            mediaRepository.deleteAll(mediaToDelete);
            return Response.ok(mediaToDelete);

        } catch (Exception e) {
            return Response.badRequest("Media deletion failed: " + e.getMessage());
        }
    }
}
