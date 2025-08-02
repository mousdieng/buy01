import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import {Cart, ProductWithMedia, UserPayload} from "../../types";
import {CartService} from "../../services/cart/cart.service";
import {CardModule} from "primeng/card";
import {MediaService} from "../../services/media/media.service";
import {TooltipModule} from "primeng/tooltip";
import {TextPreviewComponent} from "../text-preview/text-preview.component";
import {RouterLink, RouterLinkActive} from "@angular/router";
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import {AuthService} from "../../services/auth/auth.service";

@Component({
    selector: 'app-product',
    imports: [
        CommonModule,
        ButtonModule,
        CardModule,
        TooltipModule,
        TextPreviewComponent,
        RouterLink,
        RouterLinkActive,
        BadgeModule,
        RippleModule
    ],
    standalone: true,
    templateUrl: './product.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductComponent implements OnInit, OnDestroy {
    @Input({required: true}) product!: ProductWithMedia;
    @Input() showQuickActions: boolean = true;
    @Input() imageHeight: string = 'h-72';
    @Input() enableHover: boolean = true;

    private destroy$ = new Subject<void>();
    private addToCartSubject = new Subject<Event>();

    cart: Cart | null = null;

    // Signals for reactive state management
    isLoading = signal(false);
    imageError = signal(false);
    isInCart = signal(false);

    // Computed values
    stockStatus = computed(() => {
        const quantity = this.product?.product?.quantity || 0;
        if (quantity === 0) return { label: 'Out of Stock', class: 'bg-red-600' };
        if (quantity <= 5) return { label: 'Low Stock', class: 'bg-orange-500' };
        return { label: 'In Stock', class: 'bg-green-600' };
    });

    formattedPrice = computed(() => {
        const price = this.product?.product?.price || 0;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    });

    primaryImage = computed(() => {
        if (!this.product?.media?.length) return null;
        return this.getMedia(this.product.product.id, this.product.media[0].imagePath);
    });

    // Computed signal for cart quantity of this specific product
    cartQuantity = computed(() => {
        if (!this.cart || !this.product?.product?.id) return 0;
        return this.cartService.getProductQuantityInCart(this.product.product.id);
    });

    user: UserPayload | null = null;

    constructor(
        public cartService: CartService,
        private mediaService: MediaService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        // Subscribe to user state changes
        this.authService.userState$
            .pipe(takeUntil(this.destroy$))
            .subscribe(user => {
                this.user = user;
            });

        // Subscribe to cart changes to keep isInCart signal updated
        this.cartService.cart$
            .pipe(takeUntil(this.destroy$))
            .subscribe(cart => {
                this.cart = cart;
                // Update isInCart signal whenever cart changes
                this.updateIsInCartSignal();
            });

        // Debounce add to cart clicks to prevent spam
        this.addToCartSubject.pipe(
            debounceTime(300),
            takeUntil(this.destroy$)
        ).subscribe(event => this.handleAddToCart(event));

        // Initial check for isInCart
        this.updateIsInCartSignal();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private updateIsInCartSignal() {
        if (!this.product?.product?.id) {
            this.isInCart.set(false);
            return;
        }

        const productInCart = this.cartService.isProductInCart(this.product.product.id);
        this.isInCart.set(productInCart);
    }

    getMedia(productId: string, imagePath: string): string | null {
        return this.mediaService.getMedia(productId, imagePath);
    }

    addCart(event: Event) {
        event.stopPropagation();
        this.addToCartSubject.next(event);
    }

    private handleAddToCart(event: Event) {
        if (this.product.product.quantity === 0) {
            return; // Prevent adding out-of-stock items
        }

        this.isLoading.set(true);

        try {
            if (this.isInCart()) {
                // Remove from cart - need to find the cart item ID
                const cartItem = this.cartService.getCartItemByProductId(this.product.product.id);
                if (cartItem) {
                    this.cartService.removeFromCart(cartItem.id)
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => {
                                this.isLoading.set(false);
                                // isInCart will be updated via cart subscription
                            },
                            error: (error) => {
                                console.error('Error removing from cart:', error);
                                this.isLoading.set(false);
                            }
                        });
                } else {
                    this.isLoading.set(false);
                }
            } else {
                // Add to cart
                this.cartService.addToCart(this.product)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: () => {
                            this.isLoading.set(false);
                            // isInCart will be updated via cart subscription
                        },
                        error: (error) => {
                            console.error('Error adding to cart:', error);
                            this.isLoading.set(false);
                        }
                    });
            }

            // Show cart
            this.cartService.toggleCart(event);
        } catch (error) {
            console.error('Error managing cart:', error);
            this.isLoading.set(false);
        }
    }

    canShowCart(): boolean {
        return !!(this.user?.isAuthenticated && this.user.role === 'CLIENT');
    }

    onImageError() {
        this.imageError.set(true);
    }

    onImageLoad() {
        this.imageError.set(false);
    }

    // Helper method to get button text based on cart state
    getButtonText(): string {
        if (this.isLoading()) return 'Loading...';
        if (this.isInCart()) return 'Remove from Cart';
        if (this.product.product.quantity === 0) return 'Out of Stock';
        return 'Add to Cart';
    }

    // Helper method to check if button should be disabled
    isButtonDisabled(): boolean {
        return this.isLoading() || this.product.product.quantity === 0;
    }
}