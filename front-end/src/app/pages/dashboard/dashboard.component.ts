import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { CommonModule } from '@angular/common';
import {ACTION, PaginatedResponse, Product, ProductMedia, ToastMessage, UserPayload} from '../../types';
import {TableModule, TablePageEvent} from 'primeng/table';
import { ButtonModule } from 'primeng/button';

import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import {MenuItem, MessageService} from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import {EditProductComponent} from "../../components/edit-product/edit-product.component";
import {AddProductComponent} from "../../components/add-product/add-product.component";
import {AuthService} from "../../services/auth/auth.service";
import {BehaviorSubject, combineLatest, flatMap, Observable, of, startWith, switchMap, takeUntil} from "rxjs";
import {ProductService} from "../../services/product/product.service";
import {DeleteProductComponent} from "../../components/delete-product/delete-product.component";
import {MediaLayoutComponent} from "../../components/media-layout/media-layout.component";
import {catchError, finalize, map} from "rxjs/operators";
import {ToastModule} from "primeng/toast";
import {Router} from "@angular/router";
import {TextPreviewComponent} from "../../components/text-preview/text-preview.component";
import {Paginator, PaginatorState} from "primeng/paginator";
import {environment} from "../../environment";

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [AvatarModule, CommonModule, FormsModule,
        TableModule, ButtonModule, TagModule, InputIconModule, InputTextModule, MultiSelectModule,
        IconFieldModule,
        DropdownModule,
        MenuModule, AddProductComponent, EditProductComponent, DeleteProductComponent, MediaLayoutComponent, ToastModule, TextPreviewComponent, Paginator],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css',
    providers: [MessageService] // Ensure MessageService is provided here
})
export class DashboardComponent implements OnInit {
    readonly ACTION = ACTION;
    user$: Observable<UserPayload>;
    products: PaginatedResponse<ProductMedia> | null = null;
    currentPage: number = 0;
    pageSize: number = 10;
    loading: boolean = false
    private isManualPageChange: boolean = false;

    constructor(
        private authService: AuthService,
        private productService: ProductService,
        private messageService: MessageService,
        private router: Router
    ) {
        this.user$ = this.authService.userState$;
    }

    ngOnInit() {
        this.loadProducts()
    }

    getMedia(productId: string, mediaPath: string): string {
        return `${environment.apiUrl}media/${productId}/${mediaPath}`
    }

    loadProducts(): void {
        this.user$
            .pipe(
                switchMap(user => {
                    if (!user.isAuthenticated) return of(null)
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
                },
                error: (err) => {
                    console.error('Error loading products:', err);
                    this.router.navigate(['/error', {
                        message: err?.error?.message || "Failed to load products",
                        status: err?.error?.status || 500
                    }])
                }
            });
    }

    // Handle the "Next Page" action
    onNextPage(currentPage: number, totalPages: number): void {
        if (currentPage < totalPages - 1) {
            this.currentPage = currentPage + 1;
            this.isManualPageChange = true
            this.loadProducts();
        }
    }

    // Handle the "Previous Page" action
    onPreviousPage(currentPage: number): void {
        if (currentPage > 0) {
            this.currentPage = currentPage - 1;
            this.isManualPageChange = true
            this.loadProducts();
        }
    }

    // Check if the current page is the first page
    isFirstPage(page: number): boolean {
        return page === 0;
    }

    // Check if the current page is the last page
    isLastPage(currentPage: number, totalPages: number): boolean {
        return currentPage === totalPages - 1;
    }

    // Reset pagination to the first page
    reset(): void {
        this.currentPage = 0;
        this.pageSize = 10;
        this.loadProducts();
    }

    // Handle table pagination events
    onPageChange(event: PaginatorState): void {
        // Extract pagination details from event
        if (event.page !== undefined) {
            this.currentPage = event.page;
        }
        if (event.rows !== undefined) {
            this.pageSize = event.rows;
        }

        this.loadProducts();
    }

    onActionProduct(event: ToastMessage) {
        this.messageService.add(event);
        this.loadProducts()
    }

    protected readonly Math = Math;
    protected readonly environment = environment;
}