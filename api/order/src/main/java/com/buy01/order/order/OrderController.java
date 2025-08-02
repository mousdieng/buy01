package com.buy01.order.order;

import com.buy01.order.model.OrderStatus;
import com.buy01.order.model.PaymentStatus;
import com.buy01.order.model.Response;
import com.buy01.order.model.dto.*;
import com.buy01.order.service.CheckoutService;
import com.buy01.order.service.OrderStatisticsService;
import com.stripe.exception.StripeException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/order")
@Slf4j
public class OrderController {
    private final OrderService orderService;
    private final CheckoutService checkoutService;
    private final OrderStatisticsService orderStatisticsService;

    @PostMapping("/checkout/integrated")
    public ResponseEntity<Response<OrderDTO>> integratedCheckout(
            @Valid @RequestBody CheckoutRequestDTO requestDTO,
            HttpServletRequest request) throws StripeException {
        Response<OrderDTO> response = checkoutService.createIncompleteOrder(requestDTO, request);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @PostMapping("/confirm")
    public ResponseEntity<Response<OrderDTO>> confirmOrder(
            @RequestBody OrderConfirmationDTO confirmationDTO,
            HttpServletRequest request) throws StripeException {

        Response<OrderDTO> response = checkoutService.confirmOrder(confirmationDTO, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhook/stripe")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        checkoutService.handleStripeWebhook(payload, sigHeader);
        return ResponseEntity.ok("Webhook processed");
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Response<OrderDTO>> getOrder(@PathVariable String orderId, HttpServletRequest request) {
        Response<OrderDTO> response = orderService.getOrderById(orderId, request);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @GetMapping("/incomplete/user")
    public ResponseEntity<Response<Page<OrderDTO>>> getIncompleteOrders(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Response<Page<OrderDTO>> response = orderService.getIncompleteOrdersByUserId(request, page, size);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<Response<OrderDTO>> cancelOrder(
            @RequestBody CancelOrderRequestDTO dto, HttpServletRequest request) {
        Response<OrderDTO> response = orderService.cancelOrder(dto, request);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    /**
     * Delete an order
     */
    @DeleteMapping("/{orderId}")
    public ResponseEntity<Response<OrderDTO>> deleteOrder(
            @PathVariable String orderId,
            HttpServletRequest request) {
        Response<OrderDTO> response = orderService.deleteOrder(orderId, request);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    /**
     * Search orders with filters
     */
    @GetMapping("/search")
    public ResponseEntity<Response<Page<OrderDTO>>> searchOrders(
            HttpServletRequest request,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) PaymentStatus paymentStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<OrderDTO> response = orderService.searchOrdersPaginated(
                request, keyword, status, paymentStatus, startDate, endDate, page, size);
        return ResponseEntity.ok(Response.ok(response));
    }

    /**
     * Get user order statistics for profile
     */
    @GetMapping("/stats/user")
    public ResponseEntity<Response<UserStatisticsDTO>> getUserOrderStats(HttpServletRequest request) {
        Response<UserStatisticsDTO> response = orderStatisticsService.getUserOrderStats(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get seller order statistics for profile
     */
    @GetMapping("/stats/seller")
    public ResponseEntity<Response<SellerStatisticsDTO>> getSellerOrderStats(HttpServletRequest request) {
        Response<SellerStatisticsDTO> response = orderStatisticsService.getSellerOrderStats(request);
        return ResponseEntity.ok(response);
    }

}


///**
// * Get orders for seller
// */
//@GetMapping("/seller")
//public ResponseEntity<Response<Page<Order>>> getSellerOrders(
//        HttpServletRequest request,
//        @RequestParam(defaultValue = "0") int page,
//        @RequestParam(defaultValue = "10") int size) {
//    Response<Page<Order>> response = orderService.getSellerOrdersPaginated(request, page, size);
//    return ResponseEntity.status(response.getStatus()).body(response);
//}
//
///**
// * Update order status (for sellers)
// */
//@PutMapping("/{orderId}/status")
//public ResponseEntity<Response<Order>> updateOrderStatus(
//        @PathVariable String orderId,
//        @RequestParam String sellerId,
//        @RequestParam OrderStatus status) {
//    Response<Order> response = orderService.updateOrderStatus(orderId, sellerId, status);
//    return ResponseEntity.ok(response);
//}
//
//@GetMapping("/user")
//public ResponseEntity<Response<Page<Order>>> getUserOrders(
//        HttpServletRequest request,
//        @RequestParam(defaultValue = "0") int page,
//        @RequestParam(defaultValue = "10") int size) {
//    Response<Page<Order>> response = orderService.getUserOrdersPaginated(request, page, size);
//    return ResponseEntity.ok(response);
//}
