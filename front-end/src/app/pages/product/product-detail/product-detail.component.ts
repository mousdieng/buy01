import {Component, computed, OnDestroy, OnInit, Signal, signal} from '@angular/core';
import {ActivatedRoute, Route, Router, RouterLink, RouterLinkActive} from "@angular/router";
import {ACTION, FullProduct, ProductMedia, UserPayload} from "../../../types";
import {ProductService} from "../../../services/product/product.service";
import {MessageService, PrimeTemplate} from "primeng/api";
import {CarouselModule} from "primeng/carousel";
import {AccordionModule} from "primeng/accordion";
import {CommonModule} from "@angular/common";
import {TagModule} from "primeng/tag";
import {AuthService} from "../../../services/auth/auth.service";
import {debounceTime, Subject, takeUntil} from "rxjs";
import {environment} from "../../../environment";
import {Button} from "primeng/button";
import {Ripple} from "primeng/ripple";
import {Tooltip} from "primeng/tooltip";
import {CartService} from "../../../services/cart/cart.service";


type StockSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [
        CarouselModule,
        PrimeTemplate,
        AccordionModule,
        CommonModule,
        TagModule,
        RouterLink,
        RouterLinkActive,
        Button,
        Ripple,
        Tooltip
    ],
    templateUrl: './product-detail.component.html',
    styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit, OnDestroy {
    product: ProductMedia | null = null;
    responsiveOptions: any[] | undefined;

    private destroy$ = new Subject<void>();
    private addToCartSubject = new Subject<Event>();

    // Signals for reactive state management
    isLoading = signal(false);

    // Computed values
    stockStatus: Signal<{ severity: StockSeverity, label: string }> = computed(() => {
        const quantity = this.product?.product?.quantity || 0;
        if (quantity === 0) return { label: 'Out of Stock', severity: 'danger' };
        if (quantity <= 5) return { label: 'Low Stock', severity: 'warn' };
        return { label: 'In Stock', severity: 'info' };
    });

    isInCart = computed(() => {
        if (!this.product || !this.product?.product?.id) return false;
        return this.cartService.isProductInCart(this.product?.product?.id);
    });

    addCart(event: Event) {
        event.stopPropagation();
        this.addToCartSubject.next(event);
    }

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

  user: UserPayload | null = null;

  constructor(
      private route: ActivatedRoute,
      private productService: ProductService,
      private router: Router,
      private authService: AuthService,
      private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.responsiveOptions = [
      {
        breakpoint: '1400px',
        numVisible: 1,
        numScroll: 1
      },
      {
        breakpoint: '1199px',
        numVisible: 1,
        numScroll: 1
      },
      {
        breakpoint: '767px',
        numVisible: 1,
        numScroll: 1
      },
      {
        breakpoint: '575px',
        numVisible: 1,
        numScroll: 1
      }
    ]

      this.authService.userState$
          .pipe(takeUntil(this.destroy$))
          .subscribe(user => {
              this.user = user;
          })

    this.route.paramMap.subscribe(params => {
      let productId: string | null = params.get('productId');
      if (!productId) return;

      this.productService.getSingleProductsMedia(productId).subscribe({
        next: (response) => {
            console.log(response)
          this.product = response.data;
        },
        error: (err) => {
            this.router.navigate(['/error', {
                message: err?.error?.message || "Failed to load the product",
                status: err?.error?.status || 500
            }])
        }
      })
    });

      this.addToCartSubject.pipe(
          debounceTime(300),
          takeUntil(this.destroy$)
      ).subscribe(event => this.handleAddToCart(event));
  }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private handleAddToCart(event: Event) {
        if (!this.product || this.product.product.quantity === 0) {
            return;
        }

        this.isLoading.set(true);

        try {
            if (this.isInCart()) {
                this.cartService.removeFromCart(this.product?.product.id);
            } else {
                this.cartService.addToCart(this.product);
            }
            this.cartService.toggleCart(event);
        } catch (error) {
            console.error('Error managing cart:', error);
        } finally {
            this.isLoading.set(false);
        }
    }


    getMedia(productId: string, imagePath: string) {
    if (!productId || !imagePath) return null;
    return `${environment.apiUrl}media/${productId}/${imagePath}`
  }

    canShowCart(): boolean {
        return !!(this.user?.isAuthenticated && this.user.role === 'CLIENT')
    }
}