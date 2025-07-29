import {OrderStatus, PaymentStatus} from "./enum";
import {FullProduct, ProductMedia} from "./product";
import {User} from "./user";

export interface CheckoutFormData {
    email: string | null;
    phone?: string | null;
    shipping: ShippingAddress | null;
    billing: BillingAddress | null;
    items: Items[] | null;

    sameAsShipping?: boolean;
}

export interface Items {
    id: string;
    quantity: number;
}

export interface CheckoutItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
}

interface Item {
    id: string;
    quantity: number;
}

export interface CheckoutRequest {
    items: Item[];
    email: string,
    phone: string | undefined,
    shippingAddress: ShippingAddress,
    billingAddress: BillingAddress
}

export interface ShippingAddress {
    fullName: string;
    address1: string;
    address2?: string;
    postalCode: string;

    location: Partial<LocationSelection>
}

export interface BillingAddress extends ShippingAddress {}

export interface OrderSummary {
    items: {
        item: ProductMedia,
        quantity: number,
    }[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
}

export interface CheckoutResponse {
    orderId: string;
    clientSecret: string;
    paymentIntentId: string;
    message: string;
}

export interface OrderConfirmationRequest {
    paymentIntentId: string;
}

export interface LocationSelection {
    country: Country | null;
    state: State | null;
    city: City | null;
}

export interface Country {
    name: string,
    isoCode: string
}

export interface State {
    name: string,
    isoCode: string
}

export interface City {
    name: string
}



export interface Order {
    id: string,
    status: OrderStatus,
    paymentStatus: PaymentStatus,
    stripePaymentIntentId: string,
    stripeClientSecret: string,
    totalAmount: number,
    subtotal: number,
    shipping: number,
    tax: number,
    currency: string,
    userId: string
    cancelReason: string,
    createdAt: Date,
    updatedAt: Date,
    cancelledAt: Date
    completedAt: Date

    email: string,
    phone: string | undefined,

    statusHistory: OrderStatusHistory[],
    shippingAddress: ShippingAddress,
    billingAddress: BillingAddress
    orderItems: OrderItem[]
    fullOrderItem: FullProduct[]
    customer: User
}

export interface OrderStatusHistory {
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    timestamp: Date;
}

export interface OrderItem {
    productId: string,
    productName: string,
    unitPrice: number,
    quantity: number,
    totalPrice: number,
    sellerId: string
}

export interface UserStatisticsDTO {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;

    totalSpent: number;

    firstPurchaseDate: Date;
    lastPurchaseDate: Date;
    totalItemsPurchased: number;

    mostPurchasedProductId: string;
    mostPurchasedProductQuantity: number;

    favoriteSellerId: string;

    favoriteSeller: User;
    mostPurchasedProduct: ProductMedia
}

export interface SellerStatisticsDTO {
    totalRevenue: number;

    // Order Statistics
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;

    // Product Performance
    totalItemsSold: number;
    bestSellingProductId: string;
    bestSellingProductQuantity: number;

    // Time-based Analytics
    firstOrderDate: Date;
    lastOrderDate: Date;

    // Customer Insights
    totalCustomers: number;
    favoriteCustomerId: string;

    favoriteCustomer: User;
    bestSellingProduct: ProductMedia
}