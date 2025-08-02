import {Component, OnDestroy, OnInit} from '@angular/core';
import {DatePipe, DecimalPipe, NgClass, NgForOf, NgIf} from "@angular/common";
import {Cart, CartItem, Media} from "../../types"
import {Subject, takeUntil} from "rxjs";
import {CartService} from "../../services/cart/cart.service";
import {Router, RouterLink, RouterLinkActive} from "@angular/router";
import {ConfirmationService, MessageService} from "primeng/api";
import {BadgeDirective} from "primeng/badge";
import { environment } from "../../../environments/environment";
import {Button} from "primeng/button";

@Component({
  selector: 'app-cart',
  imports: [
    DecimalPipe,
    DatePipe,
    NgIf,
    BadgeDirective,
    NgClass,
    NgForOf,
    RouterLink,
    RouterLinkActive,
    Button
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart | null = null;
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
      public cartService: CartService,
      private router: Router,
      private confirmationService: ConfirmationService,
      private messageService: MessageService
  ) {
  }

  ngOnInit(): void {
    this.subscribeToCartChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToCartChanges(): void {
    this.cartService.cart$
        .pipe(takeUntil(this.destroy$))
        .subscribe(cart => {
          this.cart = cart;
        });
  }

  trackByCartItem(index: number, item: CartItem): string {
    return item.id;
  }

  increaseQuantity(item: CartItem): void {
    if (item.quantity < item.item.product.quantity) {
      this.updateQuantity(item, item.quantity + 1);
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Stock Limit',
        detail: `Only ${item.item.product.quantity} items available in stock`
      });
    }
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.updateQuantity(item, item.quantity - 1);
    }
  }

  private updateQuantity(item: CartItem, newQuantity: number): void {
    this.cartService.updateCartItem(item.id, newQuantity)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Updated',
              detail: 'Cart item quantity updated',
              life: 2000
            });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to update cart item'
            });
          }
        });
  }

  removeItem(item: CartItem): void {
    console.log('removeItem', item)
    this.cartService.removeFromCart(item.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Removed',
              detail: 'Item removed from cart',
              life: 2000
            });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to remove item from cart'
            });
          }
        });
  }

  getProductImage(id: string, media: Media[] | undefined): string {
    if (!media || !media.length) return ''
    return `${environment.apiUrl}media/${id}/${media[0]?.imagePath}`;
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
    this.cartService.hideCart()
  }
}
