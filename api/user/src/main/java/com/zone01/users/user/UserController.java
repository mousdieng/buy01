package com.zone01.users.user;

import com.zone01.users.model.*;
import com.zone01.users.model.dto.UpdateUserDTO;
import com.zone01.users.model.dto.UserDTO;
import com.zone01.users.model.dto.UserLoginDTO;
import com.zone01.users.model.dto.UserRegistrationDTO;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/user")
@Slf4j
public class UserController {
    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<Response<UserDTO>> getUserById(@PathVariable String id) {
        Response<UserDTO> response = userService.getUserById(id);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @GetMapping("/avatar/{filename}")
    public ResponseEntity<Object> getUserAvatar(@PathVariable String filename) {
        Response<Object> response = userService.getUserAvatar(filename);
        if (response.getStatus() != HttpStatus.OK.value()) {
            return ResponseEntity.status(response.getStatus()).body(response);
        }

        Resource resource = (Resource) response.getData();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_JPEG);
        headers.setContentDispositionFormData("inline", resource.getFilename());

        return ResponseEntity.status(response.getStatus()).headers(headers).body(resource);
    }

    @PostMapping(value = "/auth/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Response<AuthenticationResponse>> createUser(
            @Valid @ModelAttribute UserRegistrationDTO user
    ) {
        log.info("======== Creating user with email: {} ========", user.getEmail());
        Response<AuthenticationResponse> response = userService.createUser(user);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @PostMapping("/auth/login")
    public ResponseEntity<Response<AuthenticationResponse>> authenticate(@Valid @RequestBody UserLoginDTO user) {
        log.info("======== Login user with email: {} ========", user.getEmail());
        Response<AuthenticationResponse> response = userService.authenticate(user);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @PreAuthorize("#id == authentication.principal.id")
    @PutMapping("/{id}")
    public ResponseEntity<Response<AuthenticationResponse>> updateUser(
            @PathVariable String id,
            @Valid @ModelAttribute UpdateUserDTO updateUserDTO
            ) {
        Response<AuthenticationResponse> updatedUser = userService.updateUser(id, updateUserDTO);
        return ResponseEntity.status(updatedUser.getStatus()).body(updatedUser);
    }

    @PreAuthorize("#id == authentication.principal.id")
    @DeleteMapping("/{id}")
    public ResponseEntity<Response<UserDTO>> deleteUser(@PathVariable String id) {
        Response<UserDTO> deletedUser = userService.deleteUser(id);
        return ResponseEntity.status(deletedUser.getStatus()).body(deletedUser);
    }

}
