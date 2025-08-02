package com.buy01.order.order;

import com.buy01.order.config.kafka.AccessValidation;
import com.buy01.order.model.*;
import com.buy01.order.model.dto.CancelOrderRequestDTO;
import com.buy01.order.model.dto.OrderDTO;
import com.buy01.order.model.dto.OrderItem;
import com.buy01.order.model.dto.UserDTO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class OrderService {
    private final OrderRepository orderRepository;
    private final MongoTemplate mongoTemplate;

    public Response<OrderDTO> getOrderById(String orderId, HttpServletRequest request) {
        UserDTO currentUser = AccessValidation.getCurrentUser(request);
        Optional<Order> orderOptional = orderRepository.findByIdAndDeletedFalse(orderId);
        if (orderOptional.isEmpty()) return Response.notFound("Order not found");

        Order order = orderOptional.get();
        if (currentUser.getRole() == Role.SELLER) {
            List<OrderItem> filterOrderItems = order.getOrderItems().stream()
                    .filter(item -> item.getSellerId().equals(currentUser.getId()))
                    .toList();
            order.setOrderItems(filterOrderItems);
        }

        return Response.ok(order.toDTO(), "Order retrieved successfully");

    }

    public Response<Page<OrderDTO>> getIncompleteOrdersByUserId(HttpServletRequest request, int page, int size) {
        log.info("Retrieving incomplete orders for user");
        UserDTO currentUser = AccessValidation.getCurrentUser(request);
        if (currentUser.getRole() != Role.CLIENT) return Response.forbidden("Only clients can perform this operation");

        Page<Order> incompleteOrders = orderRepository.findByUserIdAndDeletedFalseAndPaymentStatusOrderByCreatedAtDesc(
                currentUser.getId(), PaymentStatus.INCOMPLETE, PageRequest.of(page, size));
        log.info("Retrieved {} incomplete orders for user {}", incompleteOrders.getTotalElements(), currentUser.getId());
        return Response.ok(Order.toDTO(incompleteOrders), "Incomplete orders retrieved successfully");
    }

    /**
     * Cancel an order
     */
    public Response<OrderDTO> cancelOrder(CancelOrderRequestDTO dto, HttpServletRequest request) {
        UserDTO currentUser = AccessValidation.getCurrentUser(request);
        if (currentUser.getRole() != Role.CLIENT) return Response.forbidden("Only clients can perform this operation");

        Optional<Order> orderOpt = orderRepository.findByIdAndDeletedFalse(dto.getOrderId());
        if (orderOpt.isEmpty()) return Response.notFound("Order not found");

        Order order = orderOpt.get();
        if (!order.getUserId().equals(currentUser.getId())) return Response.forbidden("You can only cancel your own orders");
        if (order.getStatus() == OrderStatus.DELIVERED) return Response.badRequest("Delivered orders cannot be cancelled");
        if (order.getStatus() == OrderStatus.CANCELLED) return Response.badRequest("Order is already cancelled");

        // For incomplete payments, just cancel the order
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(new Date());
        order.setCancelReason(dto.getReason());

        // Add status history
        OrderStatusHistory statusHistory = OrderStatusHistory.builder()
                .status(OrderStatus.CANCELLED)
                .paymentStatus(order.getPaymentStatus())
                .timestamp(new Date())
                .build();

        List<OrderStatusHistory> historyList = order.getStatusHistory() != null
                ? new ArrayList<>(order.getStatusHistory())
                : new ArrayList<>();
        historyList.add(statusHistory);
        order.setStatusHistory(historyList);

        Order savedOrder = orderRepository.save(order);
        return Response.ok(savedOrder.toDTO(), "Order cancelled successfully");
    }

    /**
     * Delete an order (soft delete)
     */
    public Response<OrderDTO> deleteOrder(String orderId, HttpServletRequest request) {
        UserDTO currentUser = AccessValidation.getCurrentUser(request);
        if (currentUser.getRole() != Role.CLIENT) return Response.forbidden("Only clients can perform this operation");

        Optional<Order> orderOpt = orderRepository.findByIdAndDeletedFalse(orderId);
        if (orderOpt.isEmpty()) return Response.notFound("Order not found");

        Order order = orderOpt.get();
        if (!order.getUserId().equals(currentUser.getId())) return Response.forbidden("You can only delete your own orders");

        // Only allow deletion of cancelled or failed orders
        if (order.getStatus() != OrderStatus.CANCELLED && order.getPaymentStatus() != PaymentStatus.FAILED) {
            return Response.badRequest("Only cancelled or failed orders can be deleted");
        }

        order.setDeleted(true);
        order.setDeletedAt(new Date());
        orderRepository.save(order);
        return Response.ok(order.toDTO(),"Order deleted successfully");
    }

    public Page<OrderDTO> searchOrdersPaginated(HttpServletRequest request, String keyword,
                                             OrderStatus status, PaymentStatus paymentStatus,
                                             Date startDate, Date endDate, int page, int size) {

        UserDTO currentUser = AccessValidation.getCurrentUser(request);

        List<Criteria> criteriaList = new ArrayList<>();
        criteriaList.add(Criteria.where("deleted").is(false));
        criteriaList.add(new Criteria().orOperator(
                Criteria.where("userId").is(currentUser.getId()),
                Criteria.where("orderItems.sellerId").is(currentUser.getId())
        ));

        // Keyword filter
        if (keyword != null && !keyword.isEmpty()) {
            criteriaList.add(new Criteria().orOperator(
                    Criteria.where("orderItems.productName").regex(keyword, "i"),
                    Criteria.where("id").regex(keyword, "i")
            ));
        }

        // Status filter
        if (status != null) {
            criteriaList.add(Criteria.where("status").is(status));
        }

        // PaymentStatus filter
        if (paymentStatus != null) {
            criteriaList.add(Criteria.where("paymentStatus").is(paymentStatus));
        }

        // Date filters
        if (startDate != null || endDate != null) {
            Criteria dateCriteria = Criteria.where("createdAt");
            if (startDate != null) {
                dateCriteria = dateCriteria.gte(startDate);
            }
            if (endDate != null) {
                dateCriteria = dateCriteria.lte(endDate);
            }
            criteriaList.add(dateCriteria);
        }

        Criteria finalCriteria = new Criteria().andOperator(criteriaList.toArray(new Criteria[0]));

        Query query = new Query(finalCriteria)
                .with(PageRequest.of(page, size));

        List<Order> results = mongoTemplate.find(query, Order.class);
        long count = mongoTemplate.count(query.skip(-1).limit(-1), Order.class); // count sans pagination

        // If current user is seller, filter orderItems per order
        if (currentUser.getRole() == Role.SELLER) {
            results = results.stream().peek(order -> {
                List<OrderItem> filteredItems = order.getOrderItems().stream()
                        .filter(item -> currentUser.getId().equals(item.getSellerId()))
                        .collect(Collectors.toList());
                order.setOrderItems(filteredItems);
            }).collect(Collectors.toList());
        }

        return new PageImpl<>(Order.toDTO(results), PageRequest.of(page, size), count);
    }
}

//public Response<Page<Order>> getUserOrdersPaginated(HttpServletRequest request, int page, int size) {
//    UserDTO currentUser = AccessValidation.getCurrentUser(request);
//    if (currentUser.getRole() != Role.CLIENT) return Response.forbidden("Only clients can perform this operation");
//
//    Page<Order> orderPage = orderRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId(), PageRequest.of(page, size));
//    return Response.ok(orderPage, "Orders retrieved successfully");
//}
//
///**
// * Get seller orders with pagination
// */
//public Response<Page<Order>> getSellerOrdersPaginated(HttpServletRequest request, int page, int size) {
//    UserDTO currentUser = AccessValidation.getCurrentUser(request);
//    if (currentUser.getRole() != Role.SELLER) return Response.forbidden("Only sellers can perform this operation.");
//
//    Page<Order> orderPage = orderRepository.findBySellerId(currentUser.getId(), PageRequest.of(page, size));
//    List<Order> filteredOrders = orderPage.getContent().stream()
//            .peek(order -> {
//                List<OrderItem> filteredItems = order.getOrderItems().stream()
//                        .filter(item -> item.getSellerId().equals(currentUser.getId()))
//                        .collect(Collectors.toList());
//                order.setOrderItems(filteredItems);
//            }).collect(Collectors.toList());
//
//    Page<Order> customPage = new PageImpl<>(filteredOrders, orderPage.getPageable(), orderPage.getTotalElements());
//    return Response.ok(customPage, "Seller orders retrieved successfully");
//}

///**
// * Update order status (for sellers)
// */
//public Response<Order> updateOrderStatus(String orderId, String sellerId,
//                                         OrderStatus newStatus) {
//    Optional<Order> orderOpt = orderRepository.findById(orderId);
//    if (orderOpt.isEmpty()) {
//        return Response.notFound("Order not found");
//    }
//
//    Order order = orderOpt.get();
//
//    // Validate seller ownership
////        if (!order.getSellerId().equals(sellerId)) {
////            return Response.forbidden("You can only update your own orders");
////        }
//
//    // Update status
//    order.setStatus(newStatus);
//    order.setUpdatedAt(new Date());
//
//    if (newStatus == OrderStatus.DELIVERED) {
//        order.setCompletedAt(new Date());
//    }
//
//    // Add status history
//    OrderStatusHistory statusHistory = OrderStatusHistory.builder()
//            .status(newStatus)
//            .paymentStatus(order.getPaymentStatus())
//            .timestamp(new Date())
//            .build();
//
//    List<OrderStatusHistory> historyList = order.getStatusHistory() != null
//            ? new ArrayList<>(order.getStatusHistory())
//            : new ArrayList<>();
//    historyList.add(statusHistory);
//    order.setStatusHistory(historyList);
//
//    Order savedOrder = orderRepository.save(order);
//    return Response.ok(savedOrder, "Order status updated successfully");
//}
//
//    public Response<List<Order>> getOrdersByUserId(String userId) {
//        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
//        return Response.<List<Order>>builder()
//                .status(200)
//                .message("Orders retrieved successfully")
//                .data(orders)
//                .build();
//    }

//    public Response<List<Order>> getRefundableOrders(String userId) {
//        List<Order> refundableOrders = orderRepository.findRefundableOrdersByUserId(userId);
//        return Response.ok(refundableOrders, "Refundable orders retrieved successfully");
//    }
//
//    /**
//     * Get orders that can be cancelled
//     */
//    public Response<List<Order>> getCancellableOrders(String userId) {
//        List<Order> cancellableOrders = orderRepository.findCancellableOrdersByUserId(userId);
//        return Response.ok(cancellableOrders, "Cancellable orders retrieved successfully");
//    }
