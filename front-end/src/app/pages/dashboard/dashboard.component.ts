import {Component, OnInit} from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { CommonModule } from '@angular/common';
import {ACTION, PaginatedResponse, ProductWithMedia, ToastMessage, UserPayload} from '../../types';
import {TableModule} from 'primeng/table';
import { ButtonModule } from 'primeng/button';

import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import {MessageService} from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { FormsModule } from '@angular/forms';
import {EditProductComponent} from "../../components/edit-product/edit-product.component";
import {AddProductComponent} from "../../components/add-product/add-product.component";
import {AuthService} from "../../services/auth/auth.service";
import {Observable} from "rxjs";
import {ProductService} from "../../services/product/product.service";
import {DeleteProductComponent} from "../../components/delete-product/delete-product.component";
import {MediaLayoutComponent} from "../../components/media-layout/media-layout.component";
import {ToastModule} from "primeng/toast";
import {Router} from "@angular/router";
import {TextPreviewComponent} from "../../components/text-preview/text-preview.component";
import {Paginator, PaginatorState} from "primeng/paginator";
import { environment } from "../../../environments/environment";
import {defaultPaginatedResponse} from "../../utils";

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
    providers: [MessageService]
})
export class DashboardComponent implements OnInit {
    readonly ACTION = ACTION;

    user$: Observable<UserPayload>;
    user: UserPayload | null = null;

    products: PaginatedResponse<ProductWithMedia> = defaultPaginatedResponse<ProductWithMedia>();
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
        this.user$
            .subscribe(user => {
                this.user = user;
            })
        this.loadProducts()
    }

    getMedia(productId: string, mediaPath: string): string {
        return `${environment.apiUrl}media/${productId}/${mediaPath}`
    }

    loadProducts(): void {
        if (!this.user) return
        this.productService.getProductsWithMediaByUserId(this.user.id, this.currentPage, this.pageSize)
            .subscribe({
                next: (response) => {
                    console.log(response)
                    this.products = response.data;
                },
                error: (err) => {
                    this.products = defaultPaginatedResponse<ProductWithMedia>();
                    this.messageService.add({
                        severity: "error",
                        summary: 'Error Fetching Product',
                        detail: err?.error?.message || 'Failed to load products'
                    })
                }
            });
    }

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