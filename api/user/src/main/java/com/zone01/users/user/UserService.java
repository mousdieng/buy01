package com.zone01.users.user;

import com.zone01.users.config.jwt.JwtService;
import com.zone01.users.dto.*;
import com.zone01.users.model.*;
import com.zone01.users.model.exception.UserNotFoundException;
import com.zone01.users.service.HelperUserService;
import com.zone01.users.service.FileServices;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    private final FileServices fileServices;
    private final AuthenticationManager authenticationManager;
    private final HelperUserService helperUserService;
    private final Validator validator;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public Response<UserDTO> getUserById(String id) {
        log.info("Getting user with the id ({})", id);
        return userRepository.findById(id)
                .map(u -> Response.ok(u.toUserDTO(), "success"))
                .orElseGet(() -> Response.notFound("User not found."));
    }

    public Response<AuthenticationResponse> createUser(UserRegistrationDTO dto) {
        Optional<User> existingUser = userRepository.findUserByEmail(dto.getEmail());
        if (existingUser.isPresent()) return Response.badRequest("Email is already used.");

        try {
            if (dto.getAvatar() != null && !dto.getAvatar().isEmpty() && dto.getRole() == Role.CLIENT)
                return Response.badRequest("Only sellers can upload an avatar.");

            String avatar = this.helperUserService.processAvatar(dto.getAvatar()).orElse(null);
            User createdUser = userRepository.save(dto.toUser(passwordEncoder, avatar));

            log.info("====== User with name: {}, email: {} has been created ======", createdUser.getName(), createdUser.getEmail());
            return Response.created(
                    AuthenticationResponse.builder()
                            .accessToken(jwtService.generateToken(createdUser))
                            .refreshToken("")
                            .build(),
                    "user has been created successfully."
            );
        } catch (Exception e) {
            log.error("====== Error creating user {} ======", e.getMessage());
            return Response.badRequest(e.getMessage());
        }

    }

    public Response<Object> getUserAvatar(String filename) {
        return fileServices.getAvatar(filename);
    }

    public Response<AuthenticationResponse> authenticate(UserLoginDTO loginRequest) {
        User user = userRepository.findUserByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new UserNotFoundException("Email is not found"));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        return Response.ok(
                AuthenticationResponse.builder()
                        .accessToken(jwtService.generateToken(user))
                        .refreshToken("")
                        .build(),
                "user has been authenticated successfully.");
    }

    public Response<AuthenticationResponse> updateUser(String userId, UpdateUserDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User is not found"));

        helperUserService.updateEntity(user, dto);
        Set<ConstraintViolation<User>> violations = validator.validate(user);
        if (!violations.isEmpty()) {
            List<String> errors = violations.stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .collect(Collectors.toList());
            return Response.badRequest(errors, "Validation failed.");
        }

        try {
            helperUserService.updateProcessAvatar(user, dto);
            userRepository.save(user);
            return Response.ok(
                    AuthenticationResponse.builder()
                            .accessToken(jwtService.generateToken(user))
                            .refreshToken("")
                            .build(),
                    "user has been updated successfully.");
        } catch (Exception e) {
            return Response.badRequest(e.getMessage());
        }
    }

    public Response<UserDTO> deleteUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User is not found"));
        userRepository.deleteById(id);
        return Response.ok(userRepository.save(user).toUserDTO(), "User deleted successfully");
    }
}
