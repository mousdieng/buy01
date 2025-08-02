package com.zone01.users.user;

import com.netflix.appinfo.ApplicationInfoManager;
import com.zone01.users.model.dto.UserDTO;
import com.zone01.users.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findUserByEmail(String email);
    boolean existsByEmail(String email);

    Optional<User> findByIdAndDeletedFalse(String id);

    Optional<User> findUserByEmailAndDeletedFalse(@NotBlank(message = "Email is required") @Email(message = "Email should be valid") String email);

    Optional<User> findUserByAvatarAndDeletedFalse(String filename);
}