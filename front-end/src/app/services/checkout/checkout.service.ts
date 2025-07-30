import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";

import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

import {
  Cart,
  OrderConfirmationRequest,
  LocationSelection,
  OrderSummary,
  CheckoutItem,
  Order,
  ApiResponse,
  CheckoutFormData, AvailableProductRequest
} from '../../types';
import { environment } from '../../environment';
import { TokenService } from '../token/token.service';
import { CartService } from '../cart/cart.service';
import { OrderService } from '../order/order.service';
import {ProductService} from "../product/product.service";

export interface CheckoutState {
  cart: Cart | null;
  items: CheckoutItem[];
  orderSummary: OrderSummary | null;
  incompleteOrders: Order[];
  selectedOrder: Order | null;
  isFormNeeded: boolean;
  shippingLocationSelection: Partial<LocationSelection>;
  billingLocationSelection: Partial<LocationSelection>;
  isLoading: boolean;
  isProcessingPayment: boolean;
  isCreatingOrder: boolean;
  showPaymentForm: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;

  private checkoutStateSubject = new BehaviorSubject<CheckoutState>(this.defaultCheckoutState());

  public checkoutState$ = this.checkoutStateSubject.asObservable();

  constructor(
      private http: HttpClient,
      private tokenService: TokenService,
      private cartService: CartService,
      private orderService: OrderService,
      private productService: ProductService
  ) {}

  // Getters for current state
  get currentState(): CheckoutState {
    return this.checkoutStateSubject.value;
  }

  get stripe$(): Stripe | null {
    return this.stripe;
  }

  get elements$(): StripeElements | null {
    return this.elements;
  }

  async initializeStripe(): Promise<void> {
    if (!this.stripe) {
      this.stripe = await loadStripe(environment.stripeApiKey);
    }
  }

  async initializeCheckout(): Promise<void> {
    this.updateState({ isLoading: true });

    try {
      await this.loadCart();
      await this.initializeStripe()
      this.calculateOrderSummary();
      this.updateState({ isLoading: false });
    } catch (error) {
      this.updateState({ isLoading: false });
      throw error;
    }
  }

  // Load cart data
  private async loadCart(): Promise<void> {
    try {
      const cart = await this.cartService.getCart();

      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Convert cart items to checkout items
      const items = cart.items.map(cartItem => ({
        id: cartItem.item.product.id,
        name: cartItem.item.product.name,
        price: cartItem.price,
        quantity: cartItem.quantity,
        imageUrl: cartItem.item.media[0]?.imagePath || ''
      }));

      this.updateState({ cart, items });
    } catch (error) {
      throw error;
    }
  }

  // Update location selections
  updateShippingLocation(selection: Partial<LocationSelection>): void {
    this.updateState({ shippingLocationSelection: selection });
  }

  updateBillingLocation(selection: Partial<LocationSelection>): void {
    this.updateState({ billingLocationSelection: selection });
  }

  // Sync billing with shipping when "same as shipping" is enabled
  syncBillingWithShipping(): void {
    const { shippingLocationSelection } = this.currentState;
    this.updateState({ billingLocationSelection: { ...shippingLocationSelection } });
  }

  // Validate location selections
  validateLocationSelections(sameAsShipping: boolean): { valid: boolean; error?: string } {
    const { shippingLocationSelection, billingLocationSelection } = this.currentState;

    if (!shippingLocationSelection.country || !shippingLocationSelection.state || !shippingLocationSelection.city) {
      return {
        valid: false,
        error: 'Please select country, state, and city for shipping address.'
      };
    }

    if (!sameAsShipping &&
        (!billingLocationSelection.country || !billingLocationSelection.state || !billingLocationSelection.city)) {
      return {
        valid: false,
        error: 'Please select country, state, and city for billing address.'
      };
    }

    return { valid: true };
  }

  createIncompleteOrder(formData: CheckoutFormData): Observable<ApiResponse<Order>> {
    this.updateState({ isCreatingOrder: true });

    return this.http.post<ApiResponse<Order>>(
          `${environment.apiUrl}order/checkout/integrated`, formData,
          { headers: this.getAuthHeaders() }
      ).pipe(
        tap(response => {
          this.updateState({
            selectedOrder: response.data,
            isCreatingOrder: false,
            showPaymentForm: true
          });
        }),
        map(response => response),
        catchError(error => {
          this.updateState({ isCreatingOrder: false });
          throw error;
        })
    );
  }

  initializeStripeElements(): void {
    const { selectedOrder } = this.currentState;

    if (this.stripe && selectedOrder?.stripeClientSecret) {
      this.elements = this.stripe.elements({
        clientSecret: selectedOrder.stripeClientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0570de',
            colorBackground: '#ffffff',
            colorText: '#30313d',
            colorDanger: '#df1b41',
            fontFamily: 'Ideal Sans, system-ui, sans-serif',
            spacingUnit: '2px',
            borderRadius: '4px',
          }
        }
      });
    }
  }

  mountPaymentElement(elementRef: HTMLElement): void {
    if (this.elements) {
      const paymentElement = this.elements.create('payment', {
        layout: 'tabs'
      });
      paymentElement.mount(elementRef);
    }
  }

  async processPayment(email: string): Promise<{ success: boolean; paymentIntentId?: string; error?: string }> {
    const { selectedOrder } = this.currentState;

    if (!this.stripe || !this.elements || !selectedOrder) {
      return {
        success: false,
        error: 'Payment system not initialized. Please refresh and try again.'
      };
    }

    this.updateState({ isProcessingPayment: true });

    try {

      const availableProduct: AvailableProductRequest[] = selectedOrder.orderItems
          .map(item => ({id: item.productId, quantity: item.quantity}))

      this.productService.productAvailable(availableProduct)
          .pipe(
              map(response => {
                if (response.status != 200) {
                  this.updateState({ isProcessingPayment: false });
                  return {
                    success: false,
                    error: `Product not available. ${response.message}. Please try again.`
                  };
                }

                return {
                  success: true,
                  data: response.data
                };
              })

          )

      const { error, paymentIntent } = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: `${window.location.origin}/profile`,
          receipt_email: email,
        },
        redirect: 'if_required'
      });

      if (error) {
        this.updateState({ isProcessingPayment: false });
        return {
          success: false,
          error: error.message || 'Payment failed. Please try again.'
        };
      }

      if (paymentIntent) {
        await this.confirmOrderWithBackend(paymentIntent.id);
        this.updateState({ isProcessingPayment: false });
        return {
          success: true,
          paymentIntentId: paymentIntent.id
        };
      }

      this.updateState({ isProcessingPayment: false });
      return {
        success: false,
        error: 'Payment processing failed. Please try again.'
      };

    } catch (error) {
      this.updateState({ isProcessingPayment: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : `An error occurred while processing payment. Please try again.`
      };
    }
  }

  private async confirmOrderWithBackend(paymentIntentId: string): Promise<any> {
    const payload: OrderConfirmationRequest = {
      paymentIntentId
    };

    try {
      return  await this.http.post(
          `${environment.apiUrl}order/confirm`,
          payload,
          { headers: this.getAuthHeaders() }
      ).toPromise();
    } catch (error) {
      return error;
    }
  }

  retryPayment(): void {
    const { selectedOrder } = this.currentState;
    if (selectedOrder) {
      this.initializeStripeElements();
      this.updateState({ showPaymentForm: true });
    }
  }

  async clearCart(): Promise<void> {
    try {
      await this.cartService.clearCart();
    } catch (error) {
      throw error;
    }
  }

  resetCheckoutState(): void {
    this.elements = null;
    this.checkoutStateSubject.next(this.defaultCheckoutState());
  }

  defaultCheckoutState(): CheckoutState {
    return {
      cart: null,
      items: [],
      orderSummary: null,
      selectedOrder: null,
      incompleteOrders: [],
      shippingLocationSelection: {
        country: null,
        state: null,
        city: null
      },
      billingLocationSelection: {
        country: null,
        state: null,
        city: null
      },
      isLoading: false,
      isProcessingPayment: false,
      isCreatingOrder: false,
      isFormNeeded: true,
      showPaymentForm: false
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.tokenService.token;
    return new HttpHeaders({
      'Authorization': `Bearer ${token?.accessToken}`,
      'Content-Type': 'application/json'
    });
  }

  public updateState(updates: Partial<CheckoutState>): void {
    this.checkoutStateSubject.next({
      ...this.currentState,
      ...updates
    });
  }

  clearStripeElements(): void {
    if (this.elements) {
      this.elements = null;
    }
  }

  public calculateOrderSummary(): void {
    const { cart, selectedOrder } = this.currentState;
    if (!cart && !selectedOrder) {
      this.updateState({ orderSummary: null });
      return;
    }

    let updatedSummary: OrderSummary;

    if (selectedOrder?.fullOrderItem?.length) {
      updatedSummary = {
        items: selectedOrder.fullOrderItem
            .map(i => ({
              item: {product: i.product, media: i.media},
              quantity: selectedOrder.orderItems.find(i => i.productId == i.productId)?.quantity || 1
            })),
        subtotal: selectedOrder.subtotal,
        shipping: selectedOrder.shipping,
        tax: selectedOrder.tax,
        total: selectedOrder.totalAmount
      }
    } else if (cart?.items?.length) {
      updatedSummary = {
        items: cart.items.map(item => ({
          item: item.item,
          quantity: item.quantity
        })),
        shipping: 100,
        tax: 10,
        subtotal: cart.totalAmount,
        total: cart.totalAmount + 100 + 10
      }
    } else {
      this.updateState({ orderSummary: null });
      return;
    }

    this.updateState({ orderSummary: updatedSummary });
  }
}