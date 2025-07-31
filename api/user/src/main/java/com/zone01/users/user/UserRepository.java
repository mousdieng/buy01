package com.zone01.users.user;

import com.zone01.users.model.dto.UserDTO;
import com.zone01.users.model.Role;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findUserByEmail(String email);

    @Query(value = "{ 'role' : { $in: ?0 } }", fields = "{ 'id': 1, 'name' : 1, 'email' : 1, 'role' : 1, 'avatar': 1 }")
    List<UserDTO> findAllByRoles(List<Role> roles);

    @Query(value = "{ 'role' : { $in: ?0 } }", fields = "{ 'id': 1, 'name' : 1, 'email' : 1, 'role' : 1, 'avatar': 1 }")
    List<UserDTO> findAllByRoles(List<Role> roles, Pageable pageable);

    boolean existsByEmail(String email);


    // New role-based query methods
//    List<User> findAllByRole(Role role);
//    Page<User> findAllByRole(Role role, Pageable pageable);
//    int countByRole(Role role);

//    @Query(value = "{ 'role' : ?0 }", fields = "{ 'id': 1, 'name' : 1, 'email' : 1, 'role' : 1, 'avatar': 1 }")
//    List<UserDTO> findBasicInfoByRole(Role role);
//
//    @Query(value = "{ 'role' : ?0 }", fields = "{ 'id': 1, 'name' : 1, 'email' : 1, 'role' : 1, 'avatar': 1 }")
//    List<UserDTO> findBasicInfoByRole(Role role, Pageable pageable);
//
//    @Query("{ 'role' : { $ne: ?0 } }")
//    List<User> findAllUsersNotWithRole(Role excludedRole);
//
//    @Query("{ 'role' : ?0, 'enabled' : ?1 }")
//    List<User> findByRoleAndStatus(Role role, boolean enabled);
}