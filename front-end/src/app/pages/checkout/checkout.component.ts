import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import {UserPayload, Order, OrderStatus, PaymentStatus, CheckoutItem, Media} from '../../types';
import { AuthService } from "../../services/auth/auth.service";
import { CheckoutService, CheckoutState } from "../../services/checkout/checkout.service";
import {OrderService} from "../../services/order/order.service";
import {OrderFormComponent} from "../../components/order-form/order-form.component";
import {Tag} from "primeng/tag";
import {Tooltip} from "primeng/tooltip";
import {environment} from "../../environment";

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    RadioButtonModule,
    CheckboxModule,
    DividerModule,
    MessagesModule,
    MessageModule,
    ProgressSpinnerModule,
    ToastModule,
    ConfirmDialogModule,
    OrderFormComponent,
    Tag,
    Tooltip,
    RouterLinkActive,
    RouterLink
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: "./checkout.component.html",
  styleUrl: "./checkout.component.css"
})
export class CheckoutComponent implements OnInit, OnDestroy {
  @ViewChild('paymentElement') paymentElementRef!: ElementRef;

  checkoutForm: FormGroup;
  checkoutState: CheckoutState;
  user: UserPayload | null = null;

  status = {
    isCartEmpty: false,
    isIncompleteOrdersEmpty: false,
  }

  private destroy$ = new Subject<void>();

  constructor(
      private fb: FormBuilder,
      public router: Router,
      private messageService: MessageService,
      private confirmationService: ConfirmationService,
      private authService: AuthService,
      private checkoutService: CheckoutService,
      private orderService: OrderService
  ) {
    this.checkoutForm = this.createCheckoutForm();
    this.checkoutState = this.checkoutService.currentState;
  }

  async ngOnInit() {
    await this.checkIncompleteOrders();
    this.checkoutService.checkoutState$
        .pipe(takeUntil(this.destroy$))
        .subscribe(state => {
          const previousState = this.checkoutState;
          this.checkoutState = state;
          if (previousState.selectedOrder !== state.selectedOrder) {
            if (!state.selectedOrder) this.clearPaymentElements()
            this.initialisePaymentIfSelectedExist();
          }
        });

    try {
      await this.checkoutService.initializeCheckout();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to initialize checkout. Please try again.'
      });

      if (error instanceof Error && error.message === 'Cart is empty') {
        this.status.isCartEmpty = true;
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.checkoutService.resetCheckoutState();
  }

  private createCheckoutForm(): FormGroup {
    return this.fb.group({
      // Customer info
      email: ['', [Validators.required, Validators.email]],
      phone: [''],

      // Shipping address
      shipping: this.fb.group({
        fullName: ['', Validators.required],
        address1: ['', Validators.required],
        address2: [''],
        postalCode: ['', Validators.required]
      }),

      // Billing address
      sameAsShipping: [true],
      billing: this.fb.group({
        fullName: [''],
        address1: [''],
        address2: [''],
        postalCode: ['']
      }),

      // Preferences
      subscribeNewsletter: [false],
      saveInfo: [false]
    });
  }

  private async checkIncompleteOrders(): Promise<void> {
    this.orderService.getIncompleteOrders()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (orders) => {
            const incompleteOrders: Order[] = orders?.data?.content ?? [];;
            if (incompleteOrders.length > 0) {
              this.checkoutService.updateState({ incompleteOrders });
            } else {
              this.status.isIncompleteOrdersEmpty = true;
            }
          },
          error: (err) => {
            this.status.isIncompleteOrdersEmpty = true;
            console.error('Error fetching incomplete orders:', err);
          }
        });
  }

  getOrderStatusSeverity(status: OrderStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' |  "contrast" | undefined {
    switch (status) {
      case OrderStatus.DELIVERED:
        return 'success';
      case OrderStatus.PENDING:
        return 'warn';
      case OrderStatus.CANCELLED:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getPaymentStatusSeverity(status: PaymentStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' |  "contrast" | undefined {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'success';
      case PaymentStatus.PENDING:
        return 'warn';
      case PaymentStatus.FAILED:
        return 'danger';
      case PaymentStatus.REFUNDED:
        return 'info';
      default:
        return 'secondary';
    }
  }

  initialisePaymentIfSelectedExist() {
    if (this.checkoutState.selectedOrder) {
      this.initializePaymentOrder();
    }
  }

  async handleSelectIncomplete(event: any) {
    const selectedOrder = event.value as Order;

    if (selectedOrder) {
      this.clearPaymentElements();

      if (!this.checkoutService.stripe$) {
        await this.checkoutService.initializeStripe();
      }

      this.checkoutService.updateState({
        selectedOrder: selectedOrder,
        isFormNeeded: false,
      });

      this.checkoutService.calculateOrderSummary()
      this.initialisePaymentIfSelectedExist();

      this.messageService.add({
        severity: 'info',
        summary: 'Order Selected',
        detail: `Incomplete order #${selectedOrder.id.substring(0, 12)}... has been selected for completion.`
      });
    }
  }

  private clearPaymentElements() {
    this.checkoutService.updateState({
      showPaymentForm: false
    });

    this.checkoutService.clearStripeElements();
  }

  private initializePaymentOrder() {
    try {
      // this.checkoutService.clearStripeElements();
      this.checkoutService.initializeStripeElements();

      this.checkoutService.updateState({
        showPaymentForm: true
      });

      setTimeout(() => {
        if (this.paymentElementRef?.nativeElement) {
          this.checkoutService.mountPaymentElement(this.paymentElementRef.nativeElement);
        }
      }, 150);

    } catch (error) {
      console.error('Error initializing payment for incomplete order:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Payment Error',
        detail: 'Failed to initialize payment. Please try again.'
      });
    }
  }

  clearOrderSelection() {
    this.clearPaymentElements();
    this.checkoutService.updateState({
      selectedOrder: null,
      isFormNeeded: true,
      showPaymentForm: false
    });

    // Reload cart items and recalculate summary
    this.checkoutService.initializeCheckout().catch(error => {
      console.error('Error reinitializing checkout:', error);
    });

    this.messageService.add({
      severity: 'info',
      summary: 'Selection Cleared',
      detail: 'Order selection has been cleared. You can now create a new order.'
    });
  }

  viewOrderDetails(event: Event, order: Order) {
    // Prevent event bubbling to avoid dropdown selection
    event.preventDefault();
    event.stopPropagation();

    // Navigate to order details page
    this.router.navigate(['/order'], {
      queryParams: { id: order.id }
    });
  }

  public initializeStripeElements = (order: Order) => {
    this.checkoutService.updateState({
      selectedOrder: order
    })

    this.initializePaymentOrder();
  }

  async handlePayment() {
    const selectedOrder = this.checkoutState.selectedOrder;
    const email = selectedOrder?.email || this.checkoutForm.value.email;

    try {
      const result = await this.checkoutService.processPayment(email);

      if (result.success && result.paymentIntentId) {
        // Clear cart after successful payment (only if it's not from incomplete order)
        if (!selectedOrder) {
          await this.checkoutService.clearCart();
        }

        // Navigate to success page
        this.router.navigate(['/order-success'], {
          queryParams: {
            orderId: this.checkoutState.selectedOrder?.id,
            paymentIntentId: result.paymentIntentId
          }
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Payment Failed',
          detail: result.error || 'Payment failed. Please try again.'
        });
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'An error occurred while processing payment. Please try again.'
      });
    }
  }

  getProductImage(id: string, media: Media[] | undefined): string {
    if (!media || !media.length) return ''
    return `${environment.apiUrl}media/${id}/${media[0]?.imagePath}`;
  }

  retryPayment() {
    this.checkoutService.retryPayment();
  }
}
