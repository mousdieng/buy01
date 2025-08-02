package com.zone01.media.media;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface MediaRepository extends MongoRepository<Media, String> {
    List<Media> findMediaByProductId(String productId);

    List<Media> findMediaByProductIdIn(List<String> productIds);

    @Transactional
    void deleteAllById(List<String> ids);

    long countByProductId(String productId);

    Optional<Media> findByIdAndDeletedFalse(String id);
    Optional<Media> findMediaByProductIdAndImagePathAndDeletedFalse(String productId, String imagePath);

    List<Media> findMediaByProductIdAndDeletedFalse(String id);

    long countByProductIdAndDeletedFalse(String productId);

    List<Media> findByDeletedFalseAndProductIdIn(List<String> productIds);
}