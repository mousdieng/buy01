import {Component, EventEmitter, Input, Output, SimpleChanges} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {ProductBase, ToastMessage} from "../../types";
import {ProductService} from "../../services/product/product.service";
import {AlertService} from "../../services/alert/alert.service";
import {AlertComponent} from "../alert/alert.component";
import {MessageService} from "primeng/api";
import {ToastModule} from "primeng/toast";


@Component({
    selector: 'app-edit-product',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, AlertComponent, ToastModule],
    templateUrl: './edit-product.component.html',
})
export class EditProductComponent {
  @Input({required: true}) product!: ProductBase;
  @Output() productEdited = new EventEmitter<ToastMessage>();

  isEditProductVisible: boolean = false;
  editProductForm: FormGroup;
  loading: boolean = false;
  formSubmitted: boolean = false;
  originalValues: any = {};

  constructor(
      private fb: FormBuilder,
      private productService: ProductService,
      private alertService: AlertService,
      private messageService: MessageService
  ) {
    this.editProductForm = this.fb.group({
      name: ['', [
        Validators.required, 
        Validators.minLength(2), 
        Validators.maxLength(20), 
        Validators.pattern(/^[A-Za-zÀ-ÿ\s'-]+$/)
      ]],
      description: ['', [
        Validators.required, 
        Validators.minLength(10), 
        Validators.maxLength(255), 
        Validators.pattern(/^[A-Za-zÀ-ÿ\s.,!?()'-]+$/)
      ]],
      price: ['', [ 
        Validators.required, 
        Validators.min(0.01), 
        Validators.pattern(/^\d+(\.\d{1,2})?$/) 
      ]],
      quantity: ['', [ 
        Validators.required, 
        Validators.min(1), 
        Validators.pattern(/^[1-9]\d*$/) 
      ]],
    });
    this.alertService.clear();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product) {
      const formValues = {
        name: this.product.name,
        description: this.product.description,
        price: this.product.price,
        quantity: this.product.quantity,
      };
      
      this.editProductForm.patchValue(formValues);
      this.originalValues = {...formValues}; // Store a copy for comparison
    }
  }

  onSubmit(): void {
    this.formSubmitted = true;
    this.editProductForm.markAllAsTouched();

    if (this.editProductForm.invalid) {
      this.messageService.add({
        severity: "warn", 
        summary: "Invalid Form", 
        detail: 'Please correct the errors in the form before submitting.'
      });
      return;
    }

    const updatedProduct: ProductBase = {
      id: this.product.id,
      name: this.editProductForm.value.name,
      description: this.editProductForm.value.description,
      price: this.editProductForm.value.price,
      quantity: this.editProductForm.value.quantity,
      userID: this.product.userID
    };

    if (this.isValuesUnchanged(updatedProduct)) {
      this.messageService.add({
        severity: "warn", 
        summary: "No Changes", 
        detail: 'Please modify at least one field before saving.'
      });
      return;
    }

    this.loading = true;
    this.productService.updateProduct(this.product.id, updatedProduct).subscribe({
      next: (response) => {
        this.loading = false;
        this.formSubmitted = false;
        this.editProductForm.reset();
        this.productEdited.emit({
          severity: "success", 
          summary: "Product Updated", 
          detail: response.message || 'Product was successfully updated!', 
          status: "OK"
        });
        this.toggle();
      },
      error: (error) => {
        this.loading = false;
        this.alertService.error(
          error?.error?.message || 'Error',
          error?.error?.data || 'Failed to update product. Please try again.'
        );
      }
    });
  }

  isValuesUnchanged(product: ProductBase): boolean {
    return product.name === this.originalValues.name &&
        product.description === this.originalValues.description &&
        Number(product.price) === Number(this.originalValues.price) &&
        Number(product.quantity) === Number(this.originalValues.quantity);
  }

  toggle(): void {
    this.isEditProductVisible = !this.isEditProductVisible;
    
    if (this.isEditProductVisible && this.product) {
      // Reset form with current product data when opening
      this.editProductForm.patchValue({
        name: this.product.name,
        description: this.product.description,
        price: this.product.price,
        quantity: this.product.quantity,
      });
      this.formSubmitted = false;
      this.alertService.clear();
    }
  }

  get nameControl() {return this.editProductForm.controls['name'];}
  get descriptionControl() {return this.editProductForm.controls['description'];}
  get priceControl() {return this.editProductForm.controls['price'];}
  get quantityControl() {return this.editProductForm.controls['quantity'];}
}
