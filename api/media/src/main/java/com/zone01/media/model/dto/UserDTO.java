package com.zone01.media.model.dto;

import com.zone01.media.model.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDTO {
    private String id;
    private String name;
    private String email;
    private Role role;
    private String avatar;
}
