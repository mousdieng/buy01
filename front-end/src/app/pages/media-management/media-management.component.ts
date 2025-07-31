import { Component, OnInit} from '@angular/core';
import {ACTION, PaginatedResponse, ProductMedia, ToastMessage, UserPayload} from '../../types';
import {CommonModule} from '@angular/common';
import { GalleriaModule } from 'primeng/galleria';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import {TextPreviewComponent} from "../../components/text-preview/text-preview.component";
import {ProductService} from "../../services/product/product.service";
import {Observable, of, switchMap} from "rxjs";
import {MediaService} from "../../services/media/media.service";
import {AuthService} from "../../services/auth/auth.service";
import {UploadImagesComponent} from "../../components/upload-images/upload-images.component";
import {MediaLayoutComponent} from "../../components/media-layout/media-layout.component";
import {CarouselModule} from "primeng/carousel";
import {Router} from "@angular/router";
import {Paginator, PaginatorState} from "primeng/paginator";
import {defaultPaginatedResponse} from "../../utils";


@Component({
    selector: 'app-media-management',
    standalone: true,
    imports: [
        CommonModule,
        GalleriaModule,
        FileUploadModule,
        ToastModule,
        BadgeModule,
        TextPreviewComponent,
        UploadImagesComponent,
        MediaLayoutComponent,
        CarouselModule,
        Paginator
    ],
    templateUrl: './media-management.component.html',
    styleUrl: './media-management.component.css',
    providers: [MessageService]
})
export class MediaManagementComponent implements OnInit {
    protected readonly ACTION = ACTION
    products: PaginatedResponse<ProductMedia> = defaultPaginatedResponse<ProductMedia>();
    selectedProduct: ProductMedia | null = null;
    currentPage: number = 0;
    pageSize: number = 10;

    files: File[] = [];
    showGallery: boolean = false;
    loading: boolean = false;
    user$: Observable<UserPayload>;

    responsiveOptions: any[] | undefined;

    constructor(
                private messageService: MessageService,
                private authService: AuthService,
                private productService: ProductService,
                private mediaService: MediaService,
                private router: Router
                ) {
        this.user$ = this.authService.userState$;
    }

    ngOnInit(): void {
        this.loadProducts();
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
    }

    getMedia(productId: string, imagePath: string): string | null {
        return this.mediaService.getMedia(productId, imagePath)
    }

    loadProducts(): void {
        this.user$
            .pipe(
                switchMap(user => {
                    if (!user.isAuthenticated) return of(null);
                    return this.productService.getProductsWithMediaByUserId(user.id, this.currentPage, this.pageSize)
                })
            )
            .subscribe({
                next: (response) => {
                    if (!response) {
                        this.router.navigate(['/auth/sign-in']); // Redirect to login if user is null
                        return
                    }
                    this.products = response.data;

                    if (this.selectedProduct) {
                        this.selectedProduct = this.products?.content?.find(
                            product => product.product.id === this.selectedProduct?.product.id
                        ) || null;
                    }
                },
                error: (err) => {
                    this.messageService.add({
                        severity: "error",
                        summary: 'Error Fetching Product',
                        detail: err?.error?.message || 'Failed to load products'
                    })
                }
            });
    }

    trackByProductId(index: number, productMedia: ProductMedia): string {
        return productMedia.product.id; // Use the product's unique identifier
    }

    handleSelectProduct(product: ProductMedia) {
      this.selectedProduct = product;
      this.showGallery = false;
      setTimeout(() => {
          this.showGallery = true;
      }, 0);
    }

    onPageChange(event: PaginatorState): void {
        if (event.page !== undefined) {
            this.currentPage = event.page;
        }
        if (event.rows !== undefined) {
            this.pageSize = event.rows;
        }

        this.loadProducts();
    }

    handleMediaAction(event: ToastMessage) {
        this.messageService.add(event)
        this.loadProducts()
    }

}
