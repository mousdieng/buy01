import { Component, EventEmitter, Input, Output } from '@angular/core';
import {ProductWithMedia, ToastMessage} from "../../types";
import { ProductService } from "../../services/product/product.service";
import { NgIf } from "@angular/common";
import { catchError, finalize } from "rxjs/operators";
import { of } from "rxjs";

@Component({
    selector: 'app-delete-product',
    imports: [NgIf],
    standalone: true,
    templateUrl: './delete-product.component.html'
})
export class DeleteProductComponent {
  @Input() productMedia!: ProductWithMedia;
  @Output() productDeleted = new EventEmitter<ToastMessage>();

  isVisible: boolean = false;
  isLoading: boolean = false;
  deleteError: string = '';

  constructor(private productService: ProductService) {}

  deleteProduct(): void {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.deleteError = '';
    
    this.productService.deleteProduct(this.productMedia.product.id).pipe(
        catchError((error) => {
          console.error('Delete failed:', error);
          this.deleteError = error?.error?.message || "Failed to delete the product. Please try again.";
          this.productDeleted.emit({
            severity: 'error',
            summary: 'Error Deleting Product',
            detail: this.deleteError,
            status: "FAILED"
          });
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
    ).subscribe((response) => {
      if (response) {
        this.productDeleted.emit({
          severity: 'success',
          summary: 'Product Deleted',
          detail: response?.message || "Product successfully deleted from your inventory.",
          status: "OK"
        });
        this.toggle();
      }
    });
  }

  toggle(): void {
    if (this.isLoading) return;
    this.deleteError = '';
    this.isVisible = !this.isVisible;
  }
  
  getProductDetails(): string {
    const product = this.productMedia.product;
    return `${product.name} (${product.price ? '$' + product.price : 'No price'}, Qty: ${product.quantity || 0})`;
  }
}
