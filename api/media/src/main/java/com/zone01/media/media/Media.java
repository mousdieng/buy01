package com.zone01.media.media;

import com.zone01.media.model.dto.MediaDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "media")
public class Media {
    @Id
    private String id;

    @Field("image_path")
    private String imagePath;
    private String productId;

    private boolean deleted = false;

    public MediaDTO toDTO() {
        return MediaDTO.builder()
                .id(id)
                .imagePath(imagePath)
                .productId(productId)
                .build();
    }

    public static List<MediaDTO> toDTO(List<Media> media) {
        return media.stream().map(Media::toDTO).toList();
    }
}