package com.buy01.order.order;

import com.buy01.order.model.OrderStatus;
import com.buy01.order.model.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {

    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<Order> findByStripePaymentIntentId(String paymentIntentId);

    @Query("{ 'orderItems.sellerId': ?0 }")
    List<Order> findBySellerId(String sellerId);



    Optional<Order> findByIdAndDeletedFalse(String orderId);

    Page<Order> findByUserIdAndDeletedFalseAndPaymentStatusOrderByCreatedAtDesc(String id, PaymentStatus paymentStatus, PageRequest of);

    Optional<Order> findByStripePaymentIntentIdAndDeletedFalse(String paymentIntentId);
}