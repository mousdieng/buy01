package com.buy01.order.order;


import com.buy01.order.model.OrderStatus;
import com.buy01.order.model.OrderStatusHistory;
import com.buy01.order.model.PaymentStatus;
import com.buy01.order.model.dto.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "order")
public class Order {
    @Id
    private String id;

    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @Field("payment_status")
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.INCOMPLETE;

    @Field("stripe_payment_intent_id")
    private String stripePaymentIntentId; // store ID returned by Stripe

    @Field("stripe_client_secret")
    private String stripeClientSecret; // store client secret for frontend

    @Field("total_amount")
    private Double totalAmount; // 💵 Le montant total à payer (subtotal + shipping + tax)
    private double subtotal;   // 🧾 Le total des articles (hors frais et taxes)

    @Transient
    public final double shipping = 100;   // 🚚 Les frais de livraison
    @Transient
    public final double tax = 10;        // 🏛️ Les taxes (TVA, etc.)

    private String email;
    private String phone;

    @Field("currency")
    @Builder.Default
    @Transient
    public final String currency = "usd";

    @Field("user_id")
    @Indexed
    private String userId;

    @Field("stripe_refund_id")
    private String stripeRefundId;

    @Field("cancel_reason")
    private String cancelReason;


    @Builder.Default
    private Date createdAt = new Date();
    private Date updatedAt;
    private Date cancelledAt;
    private Date completedAt;

    private List<OrderStatusHistory> statusHistory;
    private ShippingAddressDTO shippingAddress;
    private BillingAddressDTO billingAddress;
    private List<OrderItem> orderItems;

    public static OrderBuilder buildOrderFromCheckout(List<ProductDTO> productDTOList, CheckoutItemDTO[] checkoutItemDTOList) {
        Map<String, CheckoutItemDTO> checkoutMap = Arrays.stream(checkoutItemDTOList)
                .collect(Collectors.toMap(CheckoutItemDTO::getId, item -> item));

        final double[] subtotal = {0};

        List<OrderItem> orderItems = productDTOList.stream().map(product -> {
            CheckoutItemDTO item = checkoutMap.get(product.getId());
            int quantity = item != null ? item.getQuantity() : 0;
            double itemTotal = product.getPrice() * quantity;
            subtotal[0] += itemTotal;

            return OrderItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .unitPrice(product.getPrice())
                    .quantity(quantity)
                    .totalPrice(itemTotal)
                    .sellerId(product.getUserID())
                    .build();
        }).collect(Collectors.toList());

        double totalAmount = subtotal[0] + 100 + 10;

        return Order.builder()
                .subtotal(subtotal[0])
                .totalAmount(totalAmount)
                .orderItems(orderItems);
    }



}