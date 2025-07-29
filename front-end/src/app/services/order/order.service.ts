import { Injectable } from '@angular/core';
import { environment } from "../../environment";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { TokenService } from "../token/token.service";
import {forkJoin, Observable, of, switchMap, throwError} from "rxjs";
import {
    ApiResponse,
    CheckoutRequest,
    CheckoutResponse,
    Order,
    OrderConfirmationRequest,
    OrderStatus,
    PaymentStatus,
    PaginatedResponse,
    UserStatisticsDTO, SellerStatisticsDTO, Product, ProductMedia, User
} from "../../types";
import { catchError, map, tap, retry } from "rxjs/operators";
import {ProductService} from "../product/product.service";
import {MediaService} from "../media/media.service";
import {UserService} from "../user/user.service";

export interface OrderSearchParams {
    userId?: string;
    keyword?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    size?: number;
}

export interface CancelOrderRequest {
    orderId: string;
    reason: string;
}

export interface RefundRequest {
    orderId: string;
    reason: string;
    amount?: number;
}

export interface OrderStatusHistory {
    id: string;
    orderId: string;
    status: OrderStatus;
    timestamp: Date;
    note?: string;
    updatedBy?: string;
}

export interface OrderTrackingInfo {
    orderId: string;
    trackingNumber?: string;
    carrier?: string;
    status: string;
    estimatedDelivery?: Date;
    trackingHistory: Array<{
        status: string;
        location: string;
        timestamp: Date;
        description: string;
    }>;
}

export interface OrderAnalytics {
    period: 'week' | 'month' | 'year';
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    orderTrends: Array<{
        date: string;
        orders: number;
        revenue: number;
    }>;
    topProducts: Array<{
        productId: string;
        productName: string;
        quantity: number;
        revenue: number;
    }>;
    statusBreakdown: {
        [key in OrderStatus]: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private readonly baseUrl = environment.apiUrl + 'order';
    private readonly retryAttempts = 3;

    constructor(
        private http: HttpClient,
        private tokenService: TokenService,
        private productService: ProductService,
        private mediaService: MediaService,
        private userService: UserService
    ) {}

    private getAuthHeaders(): HttpHeaders {
        const token = this.tokenService.token;
        return new HttpHeaders({
            'Authorization': `Bearer ${token?.accessToken}`,
            'Content-Type': 'application/json'
        });
    }

    private handleError<T>(operation = 'operation', result?: T) {
        return (error: any): Observable<T> => {
            console.error(`${operation} failed:`, error);

            // Handle specific HTTP error codes
            if (error.status === 401) {
                // Handle unauthorized - maybe redirect to login
                this.tokenService.remove();
            }

            // Return a safe result or rethrow
            if (result !== undefined) {
                return of(result as T);
            }

            return throwError(() => error);
        };
    }

    /**
     * Confirm an order after payment
     */
    confirmOrder(confirmationRequest: OrderConfirmationRequest): Observable<Order> {
        return this.http.post<ApiResponse<Order>>(
            `${this.baseUrl}/confirm`,
            confirmationRequest,
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(response => response.data),
            retry(this.retryAttempts),
            catchError(this.handleError<Order>('confirmOrder'))
        );
    }

    /**
     * Get all orders for a user with pagination
     */
    getOrders(userId: string, page: number = 0, size: number = 10): Observable<PaginatedResponse<Order>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<ApiResponse<PaginatedResponse<Order>>>(
            `${this.baseUrl}/user/${userId}`,
            { headers: this.getAuthHeaders(), params }
        ).pipe(
            map(response => response.data),
            catchError(this.handleError<PaginatedResponse<Order>>('getOrders', {
                content: [],
                page: { totalPages: 0, totalElements: 0, size: 0, number: 0 }
            }))
        );
    }

    /**
     * Get incomplete orders for a user
     */
    getIncompleteOrders(page: number = 0, size: number = 10): Observable<ApiResponse<PaginatedResponse<Order>>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<ApiResponse<PaginatedResponse<Order>>>(
            `${this.baseUrl}/incomplete/user`,
            { headers: this.getAuthHeaders(), params }
        ).pipe(
            switchMap(orderResponse => {
                const orders: Order[] = orderResponse.data.content;
                if (orders.length === 0) {
                    return of({
                        status: orderResponse.status,
                        message: orderResponse.message,
                        data: {
                            content: [],
                            page: orderResponse.data.page
                        }
                    });
                }

                // For each order, enrich it with fullOrderItem[]
                const enrichedOrders$ = orders.map(order => {
                    const fullOrderItems$ = order.orderItems.map(item =>
                        forkJoin({
                            user: this.userService.getUserById(item.sellerId).pipe(map(res => res.data)),
                            product: this.productService.getProductById(item.productId).pipe(map(res => res.data)),
                            media: this.mediaService.getMediaByProductId(item.productId).pipe(map(res => res.data))
                        }).pipe(
                            map(({ user, product, media }) => ({ user, product, media }))
                        )
                    );
                    const customer$ = this.userService.getUserById(order.userId).pipe(map(res => res.data))

                    return forkJoin({
                        customer: customer$,
                        fullOrderItems: forkJoin(fullOrderItems$)
                    }).pipe(
                        map(({fullOrderItems, customer}) => {
                            order.fullOrderItem = fullOrderItems;
                            order.customer = customer;
                            return order;
                        })
                    );
                });

                return forkJoin(enrichedOrders$).pipe(
                    map(enrichedOrders => ({
                        status: orderResponse.status,
                        message: orderResponse.message,
                        data: {
                            content: enrichedOrders,
                            page: orderResponse.data.page
                        }
                    }))
                );
            })
        );
    }

    /**
     * Get single order by ID
     */
    getOrderById(orderId: string): Observable<Order> {
        return this.http.get<ApiResponse<Order>>(
            `${this.baseUrl}/${orderId}`,
            { headers: this.getAuthHeaders() }
        ).pipe(
            switchMap(orderResponse => {
                const order = orderResponse.data;
                const customer$ = this.userService.getUserById(order.userId).pipe(map(res => res.data))

                // Enrich each order item with product and media
                const fullOrderItems$ = order.orderItems.map(item =>
                    forkJoin({
                        user: this.userService.getUserById(item.sellerId).pipe(map(res => res.data)),
                        product: this.productService.getProductById(item.productId).pipe(map(res => res.data)),
                        media: this.mediaService.getMediaByProductId(item.productId).pipe(map(res => res.data))
                    }).pipe(
                        map(({ user, product, media }) => ({ user, product, media }))
                    )
                );

                return forkJoin({
                    customer: customer$,
                    fullOrderItems: forkJoin(fullOrderItems$)
                }).pipe(
                    map(({fullOrderItems, customer}) => {
                        return {
                            ...order,
                            customer,
                            fullOrderItem: fullOrderItems
                        } as Order;
                    })
                );
            })
        );
    }

    /**
     * Search orders with filters
     */
    searchOrders(params: OrderSearchParams): Observable<ApiResponse<PaginatedResponse<Order>>> {
        let httpParams = new HttpParams();

        if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
        if (params.status) httpParams = httpParams.set('status', params.status);
        if (params.paymentStatus) httpParams = httpParams.set('paymentStatus', params.paymentStatus);
        if (params.startDate) httpParams = httpParams.set('startDate', params.startDate.toISOString().split('T')[0]);
        if (params.endDate) httpParams = httpParams.set('endDate', params.endDate.toISOString().split('T')[0]);
        if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
        if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());

        return this.http.get<ApiResponse<PaginatedResponse<Order>>>(
            `${this.baseUrl}/search`,
            { headers: this.getAuthHeaders(), params: httpParams }
        ).pipe(
            switchMap(orderResponse => {
                const orders: Order[] = orderResponse.data.content;
                if (orders.length === 0) {
                    return of({
                        status: orderResponse.status,
                        message: orderResponse.message,
                        data: {
                            content: [],
                            page: orderResponse.data.page
                        }
                    });
                }

                // For each order, enrich it with fullOrderItem[]
                const enrichedOrders$ = orders.map(order => {
                    const fullOrderItems$ = order.orderItems.map(item =>
                        forkJoin({
                            user: this.userService.getUserById(item.sellerId).pipe(map(res => res.data)),
                            product: this.productService.getProductById(item.productId).pipe(map(res => res.data)),
                            media: this.mediaService.getMediaByProductId(item.productId).pipe(map(res => res.data))
                        }).pipe(
                            map(({ user, product, media }) => ({ user, product, media }))
                        )
                    );
                    const customer$ = this.userService.getUserById(order.userId).pipe(map(res => res.data))

                    return forkJoin({
                        customer: customer$,
                        fullOrderItems: forkJoin(fullOrderItems$)
                    }).pipe(
                        map(({fullOrderItems, customer}) => {
                            order.fullOrderItem = fullOrderItems;
                            order.customer = customer;
                            return order;
                        })
                    );
                });

                return forkJoin(enrichedOrders$).pipe(
                    map(enrichedOrders => ({
                        status: orderResponse.status,
                        message: orderResponse.message,
                        data: {
                            content: enrichedOrders,
                            page: orderResponse.data.page
                        }
                    }))
                );
            })
        );
    }

    /**
     * Get seller orders with pagination
     */
    getSellerOrders(sellerId: string, page: number = 0, size: number = 10): Observable<PaginatedResponse<Order>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<ApiResponse<PaginatedResponse<Order>>>(
            `${this.baseUrl}/seller/${sellerId}`,
            { headers: this.getAuthHeaders(), params }
        ).pipe(
            map(response => response.data),
            catchError(this.handleError<PaginatedResponse<Order>>('getSellerOrders', {
                content: [],
                page: { totalPages: 0, totalElements: 0, size: 0, number: 0 }
            }))
        );
    }

    /**
     * Cancel an order
     */
    cancelOrder(cancelRequest: CancelOrderRequest): Observable<Order> {
        return this.http.put<ApiResponse<Order>>(
            `${this.baseUrl}/${cancelRequest.orderId}/cancel`,
            cancelRequest,
            { headers: this.getAuthHeaders() }
        ).pipe(
            switchMap(orderResponse => {
                const order = orderResponse.data;
                const customer$ = this.userService.getUserById(order.userId).pipe(map(res => res.data))

                // Enrich each order item with product and media
                const fullOrderItems$ = order.orderItems.map(item =>
                    forkJoin({
                        user: this.userService.getUserById(item.sellerId).pipe(map(res => res.data)),
                        product: this.productService.getProductById(item.productId).pipe(map(res => res.data)),
                        media: this.mediaService.getMediaByProductId(item.productId).pipe(map(res => res.data))
                    }).pipe(
                        map(({ user, product, media }) => ({ user, product, media }))
                    )
                );

                return forkJoin({
                    customer: customer$,
                    fullOrderItems: forkJoin(fullOrderItems$)
                }).pipe(
                    map(({fullOrderItems, customer}) => {
                        return {
                            ...order,
                            customer,
                            fullOrderItem: fullOrderItems
                        } as Order;
                    })
                );
            })
        );
    }

    /**
     * Delete an order
     */
    deleteOrder(orderId: string): Observable<Order> {
        return this.http.delete<ApiResponse<Order>>(
            `${this.baseUrl}/${orderId}`,
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(response => response.data),
            catchError(this.handleError<Order>('deleteOrder'))
        );
    }

    /**
     * Update order status (for sellers)
     */
    updateOrderStatus(orderId: string, sellerId: string, status: OrderStatus): Observable<Order> {
        const params = new HttpParams()
            .set('sellerId', sellerId)
            .set('status', status);

        return this.http.put<ApiResponse<Order>>(
            `${this.baseUrl}/${orderId}/status`,
            null,
            { headers: this.getAuthHeaders(), params }
        ).pipe(
            map(response => response.data),
            catchError(this.handleError<Order>('updateOrderStatus'))
        );
    }

    /**
     * Get user order statistics
     */
    getUserOrderStats(): Observable<UserStatisticsDTO> {
        return this.http.get<ApiResponse<UserStatisticsDTO>>(
            `${this.baseUrl}/stats/user`,
            { headers: this.getAuthHeaders() }
        ).pipe(
            switchMap(orderResponse => {
                const stats = orderResponse.data;

                return forkJoin({
                    favoriteSeller: this.userService.getUserById(stats.favoriteSellerId).pipe(map(res => res.data)),
                    product: this.productService.getProductById(stats.mostPurchasedProductId).pipe(map(res => res.data)),
                    media: this.mediaService.getMediaByProductId(stats.mostPurchasedProductId).pipe(map(res => res.data))
                }).pipe(
                    map(({ favoriteSeller, product, media }) => ({
                        ...stats,
                        favoriteSeller,
                        mostPurchasedProduct: {
                            product,
                            media
                        }
                    } as UserStatisticsDTO))
                );
            }),
            catchError(this.handleError<UserStatisticsDTO>('getUserOrderStats'))
        );
    }

    /**
     * Get seller order statistics
     */
    getSellerOrderStats(): Observable<SellerStatisticsDTO> {
        return this.http.get<ApiResponse<SellerStatisticsDTO>>(
            `${this.baseUrl}/stats/seller`,
            { headers: this.getAuthHeaders() }
        ).pipe(
            switchMap(orderResponse => {
                const stats = orderResponse.data;
                return forkJoin({
                    favoriteCustomer: this.userService.getUserById(stats.favoriteCustomerId).pipe(map(res => res.data)),
                    product: this.productService.getProductById(stats.bestSellingProductId).pipe(map(res => res.data)),
                    media: this.mediaService.getMediaByProductId(stats.bestSellingProductId).pipe(map(res => res.data))
                }).pipe(
                    map(({ favoriteCustomer, product, media }) => ({
                        ...stats,
                        favoriteCustomer,
                        bestSellingProduct: {
                            product,
                            media
                        }
                    } as SellerStatisticsDTO))
                )
            }),
            catchError(this.handleError<SellerStatisticsDTO>('getSellerOrderStats'))
        );
    }

    /**
     * Reorder - creates new order from existing order
     */
    reorderFromOrder(orderId: string): Observable<CheckoutResponse> {
        return this.http.post<ApiResponse<CheckoutResponse>>(
            `${this.baseUrl}/${orderId}/reorder`,
            {},
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(response => response.data),
            catchError(this.handleError<CheckoutResponse>('reorderFromOrder'))
        );
    }

    /**
     * Get order status history
     */
    getOrderStatusHistory(orderId: string): Observable<OrderStatusHistory[]> {
        return this.http.get<ApiResponse<OrderStatusHistory[]>>(
            `${this.baseUrl}/${orderId}/history`,
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(response => response.data),
            catchError(this.handleError<OrderStatusHistory[]>('getOrderStatusHistory', []))
        );
    }

    /**
     * Track order - get tracking information
     */
    trackOrder(orderId: string): Observable<OrderTrackingInfo> {
        return this.http.get<ApiResponse<OrderTrackingInfo>>(
            `${this.baseUrl}/${orderId}/track`,
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(response => response.data),
            catchError(this.handleError<OrderTrackingInfo>('trackOrder'))
        );
    }

    /**
     * Get order receipt/invoice
     */
    getOrderReceipt(orderId: string): Observable<Blob> {
        return this.http.get(
            `${this.baseUrl}/${orderId}/receipt`,
            {
                headers: this.getAuthHeaders(),
                responseType: 'blob'
            }
        ).pipe(
            catchError(this.handleError<Blob>('getOrderReceipt'))
        );
    }

    /**
     * Request refund for an order
     */
    requestRefund(refundRequest: RefundRequest): Observable<Order> {
        return this.http.post<ApiResponse<Order>>(
            `${this.baseUrl}/${refundRequest.orderId}/refund`,
            refundRequest,
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(response => response.data),
            catchError(this.handleError<Order>('requestRefund'))
        );
    }

    /**
     * Get orders by status for seller
     */
    getSellerOrdersByStatus(sellerId: string, status: OrderStatus, page: number = 0, size: number = 10): Observable<PaginatedResponse<Order>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        return this.http.get<ApiResponse<PaginatedResponse<Order>>>(
            `${this.baseUrl}/seller/${sellerId}/status/${status}`,
            { headers: this.getAuthHeaders(), params }
        ).pipe(
            map(response => response.data),
            catchError(this.handleError<PaginatedResponse<Order>>('getSellerOrdersByStatus', {
                content: [],
                page: { totalPages: 0, totalElements: 0, size: 0, number: 0 }
            }))
        );
    }

    /**
     * Bulk update order status
     */
    bulkUpdateOrderStatus(orderIds: string[], status: OrderStatus, sellerId?: string): Observable<Order[]> {
        const body = {
            orderIds,
            status,
            sellerId
        };

        return this.http.put<ApiResponse<Order[]>>(
            `${this.baseUrl}/bulk/status`,
            body,
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(response => response.data),
            catchError(this.handleError<Order[]>('bulkUpdateOrderStatus', []))
        );
    }

    /**
     * Export orders to CSV
     */
    exportOrders(params: OrderSearchParams): Observable<Blob> {
        let httpParams = new HttpParams();

        if (params.userId) httpParams = httpParams.set('userId', params.userId);
        if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
        if (params.status) httpParams = httpParams.set('status', params.status);
        if (params.paymentStatus) httpParams = httpParams.set('paymentStatus', params.paymentStatus);
        if (params.startDate) httpParams = httpParams.set('startDate', params.startDate.toISOString().split('T')[0]);
        if (params.endDate) httpParams = httpParams.set('endDate', params.endDate.toISOString().split('T')[0]);

        return this.http.get(
            `${this.baseUrl}/export/csv`,
            {
                headers: this.getAuthHeaders(),
                params: httpParams,
                responseType: 'blob'
            }
        ).pipe(
            catchError(this.handleError<Blob>('exportOrders'))
        );
    }

}