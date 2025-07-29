import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {Subject, takeUntil} from 'rxjs';
import {Cart, Media} from '../../types';
import {CartService} from "../../services/cart/cart.service";
import {NgForOf, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {Card} from "primeng/card";
import {Button} from "primeng/button";
import {PrimeTemplate} from "primeng/api";
import {Tooltip} from "primeng/tooltip";
import {InputNumber} from "primeng/inputnumber";
import {Divider} from "primeng/divider";
import {Image} from "primeng/image";
import {environment} from "../../environment";

@Component({
    selector: 'app-cart',
    templateUrl: './cart.component.html',
    standalone: true,
    imports: [
        NgForOf,
        NgIf,
        FormsModule,
        Card,
        Button,
        PrimeTemplate,
        Tooltip,
        InputNumber,
        Divider,
        Image
    ],
    styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit, OnDestroy {
    loading = false;
    cart: Cart | null = null;

    private destroy$ = new Subject<void>();

    constructor(
        private cartService: CartService,
        public router: Router
    ) {}

    ngOnInit(): void {
        this.loadCart();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadCart(): void {
        this.cartService.cart$
            .pipe(takeUntil(this.destroy$))
            .subscribe(cart => {
                this.cart = cart;
            });
    }

    getProductImage(id: string, media: Media[] | undefined): string {
        if (!media || !media.length) return ''
        return `${environment.apiUrl}media/${id}/${media[0]?.imagePath}`;
    }

    updateQuantity(cartItemId: string, quantity: number): void {
        if (quantity < 1) return;

        this.loading = true;
        this.cartService.updateCartItem(cartItemId, quantity)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    removeItem(cartItemId: string): void {
        this.loading = true;
        this.cartService.removeFromCart(cartItemId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    clearCart(): void {
        this.loading = true;
        this.cartService.clearCart()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.loading = false;
                },
                error: (error) => {
                    this.loading = false;
                }
            });
    }

    proceedToCheckout(): void {
        if (!this.cart || this.cart.items.length === 0) return;

        this.router.navigate(['/checkout']);
    }

    getSubtotal(): number {
        return this.cart?.totalAmount || 0;
    }

    getTotal(): number {
        return this.getSubtotal() + 10 + 100;
    }

    // Helper method to check if cart is empty
    isCartEmpty(): boolean {
        return !this.cart || this.cart.items.length === 0;
    }

    // Helper method to get total items count
    getTotalItemsCount(): number {
        return this.cart?.totalItems || 0;
    }
}
