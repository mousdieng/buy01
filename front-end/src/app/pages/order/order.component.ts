import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from "../../services/auth/auth.service";
import {CancelOrderRequest, OrderService} from "../../services/order/order.service";
import {finalize, Observable, Subject, takeUntil} from "rxjs";
import { Order, OrderStatus, PaymentStatus, UserPayload} from "../../types";
import {ConfirmationService, MessageService, PrimeTemplate} from "primeng/api";
import {Button} from "primeng/button";
import {Dialog} from "primeng/dialog";
import {Card} from "primeng/card";
import {Avatar} from "primeng/avatar";
import {Tag} from "primeng/tag";
import {Skeleton} from "primeng/skeleton";
import {DatePipe, NgForOf, NgIf} from "@angular/common";
import {Divider} from "primeng/divider";
import {Timeline} from "primeng/timeline";
import {InputTextarea} from "primeng/inputtextarea";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {ConfirmDialog} from "primeng/confirmdialog";
import {Toast} from "primeng/toast";
import {ActivatedRoute, Router} from "@angular/router";
import {MediaService} from "../../services/media/media.service";
import {environment} from "../../environment";

import {CheckoutService} from "../../services/checkout/checkout.service";
import {OrderFormComponent} from "../../components/order-form/order-form.component";

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [
    Button,
    Dialog,
    Card,
    Avatar,
    Tag,
    Skeleton,
    NgIf,
    NgForOf,
    Divider,
    Timeline,
    PrimeTemplate,
    InputTextarea,
    DatePipe,
    FormsModule,
    ConfirmDialog,
    Toast,
    ReactiveFormsModule,
    OrderFormComponent,
  ],
  templateUrl: './order.component.html',
  styleUrl: './order.component.css'
})
export class OrderComponent implements OnInit, OnDestroy {
  orderId!: string;
  order: Order | null = null;
  ordersLoading: boolean = false;
  private destroy$ = new Subject<void>();

  user$: Observable<UserPayload>;
  user: UserPayload | null = null;


  // Dialog states
  showCancelOrderDialog = false;
  cancelReason = '';
  removeOrderDialog = false;
  reOrderDialog = false;

  keepSameInformation: boolean = false;

  constructor(
      private route: Router,
      private activeRoute: ActivatedRoute,
      private authService: AuthService,
      private orderService: OrderService,
      private messageService: MessageService,
      private confirmationService: ConfirmationService,
      private mediaService: MediaService,
      private checkoutService: CheckoutService,
  ) {
    this.user$ = this.authService.userState$;
  }

  ngOnInit(): void {
    this.loadUserData();
    this.activeRoute.queryParams.subscribe(params => {
      this.orderId = params['id'];
      this.loadOrder();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserData(): void {
    this.user$
        .pipe(takeUntil(this.destroy$))
        .subscribe(user => {
          this.user = user;
        });
  }

  getMedia(productId: string, imagePath: string): string | null {
    return this.mediaService.getMedia(productId, imagePath)
  }

  private loadOrder(): void {
    this.ordersLoading = true;
    this.orderService.getOrderById(this.orderId)
        .pipe(
            takeUntil(this.destroy$),
            finalize(() => this.ordersLoading = false)
        )
        .subscribe({
          next: (response: Order) => {
            this.order = response;
            console.log("fffff", this.order)
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Unable to load order details'
            });
            this.order = null;
          }
        });
  }

  // Helper methods for order item data
  getItemQuantity(productId: string): number {
    const item = this.order?.orderItems.find(item => item.productId === productId);
    return item?.quantity || 0;
  }

  getItemTotalPrice(productId: string): number {
    const item = this.order?.orderItems.find(item => item.productId === productId);
    return item?.totalPrice || 0;
  }

  getUniqueSellers() {
    if (!this.order?.fullOrderItem) return [];
    const sellersMap = new Map();
    this.order.fullOrderItem.forEach(item => {
      sellersMap.set(item.user.id, item.user);
    });
    return Array.from(sellersMap.values());
  }

  getOrderStatusSeverity(status: OrderStatus): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    const statusSeverities: Record<OrderStatus, "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined> = {
      [OrderStatus.PENDING]: 'warn',
      [OrderStatus.DELIVERED]: 'success',
      [OrderStatus.CANCELLED]: 'danger',

    };
    return statusSeverities[status] || 'info';
  }

  getPaymentStatusSeverity(status: PaymentStatus): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    const paymentSeverities: Record<PaymentStatus, "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined> = {
      [PaymentStatus.PENDING]: 'warn',
      [PaymentStatus.COMPLETED]: 'success',
      [PaymentStatus.FAILED]: 'danger',
      [PaymentStatus.REFUNDED]: 'secondary',

      [PaymentStatus.INCOMPLETE]: 'secondary',
      [PaymentStatus.PROCESSING]: 'secondary',
      [PaymentStatus.CANCELLED]: 'secondary',
      [PaymentStatus.EXPIRED]: 'secondary'
    };
    return paymentSeverities[status] || 'info';
  }

  // Permission checks
  canPerformActions(): boolean {
    return this.order != null && this.user?.role === 'CLIENT' && (this.canCancelOrder() || this.canRemoveOrder() || this.canReOrder());
  }

  canCancelOrder(): boolean {
    return this.user?.role === 'CLIENT' &&
        this.order?.status === OrderStatus.PENDING && this.order?.paymentStatus != PaymentStatus.COMPLETED;
  }

  canRemoveOrder(): boolean {
    return this.user?.role === 'CLIENT' &&
        this.order?.status === OrderStatus.CANCELLED;
  }

  canCompleteOrder(): boolean {
    return this.user?.role === 'CLIENT' &&
        this.order?.status === OrderStatus.PENDING;
  }

  completeOrder() {
    this.checkoutService.updateState({
      selectedOrder: this.order,
      isFormNeeded: false
    })
    this.route.navigate(['/checkout']);
  }

  canReOrder(): boolean {
    return this.user?.role === 'CLIENT' &&
        this.order?.status === OrderStatus.DELIVERED;
  }

  // Dialog methods
  showCancelDialog(): void {
    this.showCancelOrderDialog = true;
    this.cancelReason = '';
  }

  hideCancelDialog(): void {
    this.showCancelOrderDialog = false;
    this.cancelReason = '';
  }

  showRemoveOrderDialog(): void {
    this.removeOrderDialog = true;
  }

  hideRemoveOrderDialog(): void {
    this.removeOrderDialog = false;
  }

  showReOrderDialog(): void {
    this.reOrderDialog = true;
  }

  hideReOrderDialog(): void {
    this.reOrderDialog = false;
  }

  confirmCancelOrder(): void {
    this.confirmationService.confirm({
      message: 'This action cannot be undone. Are you sure you want to cancel this order?',
      header: 'Confirm Cancellation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const cancelRequest: CancelOrderRequest = {
          orderId: this.orderId,
          reason: this.cancelReason
        }
        this.orderService.cancelOrder(cancelRequest)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (order) => {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Order Cancelled',
                  detail: 'Your order has been successfully cancelled.'
                });
                this.order = order
              },
              error: (err) => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Order Cancelled Failed',
                  detail: "something went wrong"
                });
              }
            });

        this.hideCancelDialog();
        // this.loadOrder(); // Reload order data
      }
    });
  }

  confirmRemoveOrder(): void {
    this.confirmationService.confirm({
      message: 'This action cannot be undone. Are you sure you want to cancel this order?',
      header: 'Confirm removing',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.orderService.deleteOrder(this.orderId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (order) => {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Order Removed',
                  detail: 'Your order has been successfully remove.'
                });
                this.route.navigate(['/profile']);
              },
              error: (err) => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Order Removed Failed',
                  detail: "something went wrong"
                });
              }
            });

        this.hideCancelDialog();
        // this.loadOrder(); // Reload order data
      }
    });
  }

  protected readonly environment = environment;
}
