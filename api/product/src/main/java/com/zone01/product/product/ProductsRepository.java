package com.zone01.product.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductsRepository extends MongoRepository<Products, String> {
    Optional<Products> findByIdAndDeleted(String id, boolean deleted);

    Page<Products> findByActiveAndDeleted(boolean active, boolean deleted, Pageable pageable);

    Page<Products> findByUserIDAndDeleted(String userId, boolean deleted, Pageable pageable);
    Optional<List<Products>> findByUserIDAndDeleted(String userId, boolean deleted);

    Optional<Products> findByIdAndActiveAndDeleted(String id, boolean active, boolean deleted);
    Optional<Products> findByIdAndDeletedFalse(String id);

    List<Products> findByActiveAndDeletedAndIdIn(boolean active, boolean delete, List<String> productIds);
    List<Products> findByDeletedAndIdIn(boolean delete, List<String> productIds);

}


/*
    Page<Products> findByActiveTrue(Pageable pageable);
    Page<Products> findByDeletedTrue(Pageable pageable);
    Page<Products> findByActiveTrueOrDeletedTrue(Pageable pageable);
    Page<Products> findByActiveFalseAndDeletedFalse(Pageable pageable);

    Page<Products> findByUserIDAndActiveTrue(String userId, Pageable pageable);
    Page<Products> findByUserIDAndDeletedTrue(String userId, Pageable pageable);
    Page<Products> findByUserIDAndActiveTrueOrDeletedTrue(String userId, Pageable pageable);
    Page<Products> findByUserIDAndActiveFalseAndDeletedFalse(String userId, Pageable pageable);

    Optional<Products> findByIdAndActiveTrue(String id);
    Optional<Products> findByIdAndDeletedTrue(String id);
    @Query("{ '_id': ?0, $or: [{'active': true}, {'deleted': true}] }")
    Optional<Products> findByIdAndActiveTrueOrDeletedTrue(String id);
    Optional<Products> findByIdAndActiveFalseAndDeletedFalse(String id);

     List<Products> findByIdInAndActiveTrue(List<String> productIds);
    List<Products> findByIdInAndDeletedTrue(List<String> productIds);
    List<Products> findByIdInAndActiveFalseAndDeletedFalse(List<String> productIds);
* */










//public interface ProductsRepository extends MongoRepository<Products, String> {
//    Page<Products> findProductsByUserID(String userId, Pageable pageable);
//    Page<Products> findAll( Pageable pageable);
//    List<Products> findByIdIn(List<String> productIds);
//
//    Optional<List<Products>> findByUserID(String id);
//}