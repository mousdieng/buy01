package com.zone01.users.model.dto;

import com.zone01.users.model.Role;
import com.zone01.users.user.User;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.apache.commons.text.StringEscapeUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

@Data
@AllArgsConstructor
public class UserRegistrationDTO {
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 20, message = "Name must be between 2 and 20 characters")
    @Pattern(regexp = "^[A-Za-zÀ-ÿ\\s'-]+$", message = "Name can only contain letters, spaces, hyphens, and apostrophes")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @Size(min = 8, message = "Password must be at least 8 characters long")
    @NotBlank(message = "Password is required")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"
    )
    private String password;

    private Role role;

    private MultipartFile avatar;

    public User toUser(PasswordEncoder passwordEncoder, String avatar) {
        String escapedName = StringEscapeUtils.escapeHtml4(this.getName().toLowerCase()).replace("'", "&#39;");
        return User.builder()
                .name(escapedName)
                .email(this.getEmail())
                .password(passwordEncoder.encode(this.getPassword()))
                .role(this.getRole())
                .avatar(avatar)
                .build();
    }
}
