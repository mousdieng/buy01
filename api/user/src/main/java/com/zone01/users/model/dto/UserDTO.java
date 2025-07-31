package com.zone01.users.model.dto;

import com.zone01.users.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class UserDTO {
    private String id;
    private String name;
    private String email;
    private Role role;
    private String avatar;

//    private String customer;
//    private List<String> paymentMethod;


}
