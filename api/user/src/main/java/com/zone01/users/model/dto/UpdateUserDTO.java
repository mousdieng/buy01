package com.zone01.users.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@AllArgsConstructor
public class UpdateUserDTO {
    private String name;
    private String prev_password;
    private String new_password;
    private MultipartFile avatar;
}