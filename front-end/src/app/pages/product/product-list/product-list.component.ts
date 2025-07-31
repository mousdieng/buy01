import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpParamsProductsSearch, PaginatedResponse, ProductMedia } from "../../../types";
import { Router } from "@angular/router";
import { ProductService } from "../../../services/product/product.service";
import { MediaService } from "../../../services/media/media.service";
import {NgClass, NgForOf, NgIf} from "@angular/common";
import { ProductComponent } from "../../../components/product/product.component";
import { Paginator, PaginatorState } from "primeng/paginator";
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import { BehaviorSubject, debounceTime, distinctUntilChanged, takeUntil, Subject } from "rxjs";
import { Slider } from "primeng/slider";
import { InputText } from "primeng/inputtext";
import {DropdownModule} from "primeng/dropdown";
import {Toast} from "primeng/toast";
import {MessageService} from "primeng/api";
import {defaultPaginatedResponse} from "../../../utils";

interface PriceRange {
    min: number;
    max: number;
}

interface QuantityRange {
    min: number;
    max: number;
}

interface FilterState {
    keyword: string;
    priceRange: PriceRange;
    quantityRange: QuantityRange;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [
        NgIf,
        NgForOf,
        ProductComponent,
        Paginator,
        ReactiveFormsModule,
        Slider,
        InputText,
        DropdownModule,
        NgClass,
        FormsModule,
        Toast
    ],
    providers: [MessageService],
    templateUrl: './product-list.component.html',
    styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit, OnDestroy {
    products: PaginatedResponse<ProductMedia> = defaultPaginatedResponse<ProductMedia>();
    currentPage: number = 0;
    pageSize: number = 12;
    isLoading: boolean = false;

    filterForm: FormGroup;
    private filterSubject = new BehaviorSubject<FilterState>(this.getInitialFilterState());
    private destroy$ = new Subject<void>();

    sortOptions = [
        { label: 'Name (A-Z)', value: 'name_asc' },
        { label: 'Name (Z-A)', value: 'name_desc' },
        { label: 'Price (Low to High)', value: 'price_asc' },
        { label: 'Price (High to Low)', value: 'price_desc' },
        { label: 'Quantity (Low to High)', value: 'quantity_asc' },
        { label: 'Quantity (High to Low)', value: 'quantity_desc' },
        { label: 'Recently Added', value: 'created_desc' }
    ];

    priceRange: number[] = [0, 1000];
    quantityRange: number[] = [0, 100];
    maxPrice: number = 1000;
    maxQuantity: number = 100;

    showFilters: boolean = false;
    activeFiltersCount: number = 0;

    constructor(
        private productService: ProductService,
        private mediaService: MediaService,
        private router: Router,
        private fb: FormBuilder,
        private messageService: MessageService,
    ) {
        this.filterForm = this.createFilterForm();
    }

    ngOnInit(): void {
        this.setupFilters();
        this.loadProductBounds();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private getInitialFilterState(): FilterState {
        return {
            keyword: '',
            priceRange: { min: 0, max: 1000 },
            quantityRange: { min: 0, max: 100 },
            sortBy: 'name',
            sortOrder: 'asc'
        };
    }

    private createFilterForm(): FormGroup {
        return this.fb.group({
            keyword: [''],
            priceRange: [[0, 1000]],
            quantityRange: [[0, 100]],
            sortBy: ['name_asc'],
            minPrice: [0, [Validators.min(0)]],
            maxPrice: [1000, [Validators.min(0)]],
            minQuantity: [0, [Validators.min(0)]],
            maxQuantity: [100, [Validators.min(0)]]
        });
    }

    private setupFilters(): void {
        this.filterForm.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.updateFilterState();
            this.currentPage = 0;
            this.loadProducts();
        });

        // Initial load
        this.loadProducts();
    }

    private updateFilterState(): void {
        const formValue = this.filterForm.value;
        const [sortBy, sortOrder] = formValue.sortBy.split('_');

        const filterState: FilterState = {
            keyword: formValue.keyword || '',
            priceRange: {
                min: formValue.minPrice || formValue.priceRange[0],
                max: formValue.maxPrice || formValue.priceRange[1]
            },
            quantityRange: {
                min: formValue.minQuantity || formValue.quantityRange[0],
                max: formValue.maxQuantity || formValue.quantityRange[1]
            },
            sortBy: sortBy,
            sortOrder: sortOrder as 'asc' | 'desc'
        };

        this.filterSubject.next(filterState);
        this.calculateActiveFilters(filterState);
    }

    private calculateActiveFilters(state: FilterState): void {
        let count = 0;
        const initial = this.getInitialFilterState();

        if (state.keyword) count++;
        if (state.priceRange.min !== initial.priceRange.min || state.priceRange.max !== initial.priceRange.max) count++;
        if (state.quantityRange.min !== initial.quantityRange.min || state.quantityRange.max !== initial.quantityRange.max) count++;
        if (state.sortBy !== initial.sortBy || state.sortOrder !== initial.sortOrder) count++;

        this.activeFiltersCount = count;
    }

    private loadProductBounds(): void {
        this.maxPrice = 1000;
        this.maxQuantity = 100;
        this.priceRange = [0, this.maxPrice];
        this.quantityRange = [0, this.maxQuantity];
    }

    loadProducts(): void {
        this.isLoading = true;
        const filterState = this.filterSubject.value;

        const searchParams: HttpParamsProductsSearch = {
            keyword: filterState.keyword || undefined,
            priceMin: filterState.priceRange.min,
            priceMax: filterState.priceRange.max,
            quantityMin: filterState.quantityRange.min,
            quantityMax: filterState.quantityRange.max,
            sortBy: filterState.sortBy,
            sortOrder: filterState.sortOrder,
            page: this.currentPage,
            size: this.pageSize
        };

        this.productService.searchProducts(searchParams)
            .subscribe({
                next: (response) => {
                    this.products = response.data;
                    this.isLoading = false;
                },
                error: (err) => {
                    console.log(err);
                    this.isLoading = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Fetch Product Failed',
                        detail: err?.error?.message || "Failed to load products"
                    })
                    this.products = defaultPaginatedResponse<ProductMedia>();
                }
            });
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

    onPriceRangeChange(value: number[] | undefined): void {
        if (!value) return;
        this.filterForm.patchValue({
            minPrice: value[0],
            maxPrice: value[1],
            priceRange: value
        });
    }

    onQuantityRangeChange(value: number[] | undefined): void {
        if (!value) return;
        this.filterForm.patchValue({
            minQuantity: value[0],
            maxQuantity: value[1],
            quantityRange: value
        });
    }

    clearAllFilters(): void {
        const initialState = this.getInitialFilterState();
        this.filterForm.patchValue({
            keyword: '',
            priceRange: [initialState.priceRange.min, initialState.priceRange.max],
            quantityRange: [initialState.quantityRange.min, initialState.quantityRange.max],
            selectedUserIds: [],
            sortBy: 'name_asc',
            minPrice: initialState.priceRange.min,
            maxPrice: initialState.priceRange.max,
            minQuantity: initialState.quantityRange.min,
            maxQuantity: initialState.quantityRange.max
        });
        this.priceRange = [initialState.priceRange.min, initialState.priceRange.max];
        this.quantityRange = [initialState.quantityRange.min, initialState.quantityRange.max];
    }

    clearKeyword(): void {
        this.filterForm.patchValue({ keyword: '' });
    }

    clearPriceFilter(): void {
        const initial = this.getInitialFilterState();
        this.filterForm.patchValue({
            priceRange: [initial.priceRange.min, initial.priceRange.max],
            minPrice: initial.priceRange.min,
            maxPrice: initial.priceRange.max
        });
        this.priceRange = [initial.priceRange.min, initial.priceRange.max];
    }

    clearQuantityFilter(): void {
        const initial = this.getInitialFilterState();
        this.filterForm.patchValue({
            quantityRange: [initial.quantityRange.min, initial.quantityRange.max],
            minQuantity: initial.quantityRange.min,
            maxQuantity: initial.quantityRange.max
        });
        this.quantityRange = [initial.quantityRange.min, initial.quantityRange.max];
    }

    clearUserFilter(): void {
        this.filterForm.patchValue({ selectedUserIds: [] });
    }

    resetSort(): void {
        this.filterForm.patchValue({ sortBy: 'name_asc' });
    }

    toggleFilters(): void {
        this.showFilters = !this.showFilters;
    }

    getMedia(productId: string, imagePath: string): string | null {
        return this.mediaService.getMedia(productId, imagePath);
    }

    trackByProductId(index: number, item: ProductMedia): string {
        return item.product.id;
    }

    // Utility methods for template
    get hasActiveFilters(): boolean {
        return this.activeFiltersCount > 0;
    }

    get currentSort(): string {
        const sortValue = this.filterForm.get('sortBy')?.value;
        return this.sortOptions.find(option => option.value === sortValue)?.label || 'Name (A-Z)';
    }

    get selectedUsersCount(): number {
        return this.filterForm.get('selectedUserIds')?.value?.length || 0;
    }

    get keywordControl(): FormControl {
        return this.filterForm.get('keyword') as FormControl;
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    }
}