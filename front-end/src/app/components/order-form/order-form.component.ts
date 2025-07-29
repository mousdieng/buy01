import {Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {LocationSelection, Order, ShippingAddress, BillingAddress, CheckoutFormData} from "../../types";
import {CheckoutService} from "../../services/checkout/checkout.service";
import {InputText} from "primeng/inputtext";
import {NgIf} from "@angular/common";
import {CountryStateCitySelectorComponent} from "../country-state-city-selector/country-state-city-selector.component";
import {Checkbox} from "primeng/checkbox";
import {Button} from "primeng/button";
import {MessageService} from "primeng/api";
import {Subject, takeUntil} from "rxjs";
import {Router} from "@angular/router";
import {CartService} from "../../services/cart/cart.service";

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputText,
    NgIf,
    CountryStateCitySelectorComponent,
    Checkbox,
    FormsModule,
    Button
  ],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.css'
})
export class OrderFormComponent implements OnDestroy {
  @Input() order: Order | null = null;
  @Input({required: true}) isInCheckout: boolean = false;
  @Input() initializeStripeElements!: (order: Order) => void;
  @Input({required: true}) isReOrdering: boolean = false;

  checkoutForm: FormGroup;
  isCreatingOrder: boolean = false;
  private destroy$ = new Subject<void>();

  keepSameInfo: boolean = false;

  constructor(
      private fb: FormBuilder,
      private checkoutService: CheckoutService,
      private messageService: MessageService,
      private router: Router,
      private cartService: CartService
  ) {
    this.checkoutForm = this.createCheckoutForm();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createCheckoutForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],

      shipping: this.fb.group({
        fullName: ['', [Validators.required, Validators.minLength(2)]],
        address1: ['', [Validators.required, Validators.minLength(5)]],
        address2: [''],
        city: ['', [Validators.required, Validators.minLength(2)]],
        state: ['', [Validators.required]],
        country: ['', [Validators.required]],
        countryCode: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]],
        stateCode: ['', [Validators.required]],
        postalCode: ['', [Validators.required, Validators.pattern(/^[\w\s\-]{3,10}$/)]]
      }),

      sameAsShipping: [true],
      billing: this.fb.group({
        fullName: [''],
        address1: [''],
        address2: [''],
        city: [''],
        state: [''],
        country: [''],
        countryCode: [''],
        stateCode: [''],
        postalCode: ['']
      }),
    });
  }

  proceedToReOrder() {
    const formData: CheckoutFormData = {
      email: this.order?.email || null,
      phone: this.order?.phone || null,
      shipping: this.order?.shippingAddress || null,
      billing: this.order?.billingAddress || null,
      items: this.order?.orderItems?.map(item => ({id: item.productId, quantity: item.quantity})) || null
    }

    if ( !formData.shipping || !formData.billing || !formData.items) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete Order',
        detail: 'Please fill in all required fields.'
      });
      return;
    }

    this.createOrder(formData)
  }

  async proceedToPayment() {
    const locationValidation = this.checkoutService.validateLocationSelections(
        this.checkoutForm.get('sameAsShipping')?.value
    );

    if ( !this.checkoutService.currentState.items || this.checkoutService.currentState.items.length === 0 ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete Order',
        detail: 'Please fill your cart before proceeding to payment.'
      });
      return;
    }


    if (!locationValidation.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete Address',
        detail: locationValidation.error
      });
      return;
    }

    if (this.checkoutForm.valid) {
      try {
        const values = this.checkoutForm.value;
        const shippingAddress: ShippingAddress = {
            fullName: values.shipping.fullName,
            address1: values.shipping.address1,
            address2: values.shipping.address2,
            postalCode: values.shipping.postalCode,
            location: {
              country: { name: values.shipping.country, isoCode: values.shipping.countryCode },
              state: { name: values.shipping.state, isoCode: values.shipping.stateCode },
              city: { name: values.shipping.city }
            }
          }

          const billingAddress: BillingAddress = values.sameAsShipping ? shippingAddress : {
            fullName: values.billing.fullName,
            address1: values.billing.address1,
            address2: values.billing.address2,
            postalCode: values.billing.postalCode,
            location: {
              country: { name: values.billing.country, isoCode: values.billing.countryCode },
              state: { name: values.billing.state, isoCode: values.billing.stateCode },
              city: { name: values.billing.city }
            }
          }

        const formData: CheckoutFormData = {
          email: values.email,
          phone: values.phone,
          shipping: shippingAddress,
          billing: billingAddress,
          items: this.checkoutService.currentState.items.map(item => ({id: item.id, quantity: item.quantity}))
        }

        this.createOrder(formData)
      } catch (error) {
        console.error('Error proceeding to payment:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to proceed to payment. Please try again.'
        });
      }
    } else {
      this.markFormGroupTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Form Invalid',
        detail: 'Please fill in all required fields.'
      });
    }
  }

  createOrder(formData: CheckoutFormData) {
    this.checkoutService.createIncompleteOrder(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Order Created',
              detail: 'Order created successfully. Complete payment to finalize.'
            });

            if (!this.isReOrdering) {
              this.checkoutService.updateState({
                selectedOrder: response.data
              })
              this.cartService.clearCart();
            } else {
              this.checkoutService.updateState({
                selectedOrder: response.data,
                isFormNeeded: false
              })
              this.router.navigate(['/checkout']);
            }
          },
          error: (error) => {
            console.error('Error creating order:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to create order. Please try again.'
            });
          }
        });
  }

  private markFormGroupTouched() {
    Object.keys(this.checkoutForm.controls).forEach(key => {
      const control = this.checkoutForm.get(key);
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(nestedKey => {
          control.get(nestedKey)?.markAsTouched();
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  private addBillingValidation(): void {
    const billingGroup = this.checkoutForm.get('billing') as FormGroup;
    billingGroup.get('fullName')?.setValidators([Validators.required]);
    billingGroup.get('address1')?.setValidators([Validators.required]);
    billingGroup.get('postalCode')?.setValidators([Validators.required]);

    billingGroup.get('city')?.setValidators([Validators.required]);
    billingGroup.get('state')?.setValidators([Validators.required]);
    billingGroup.get('country')?.setValidators([Validators.required]);

    Object.keys(billingGroup.controls).forEach(key => {
      billingGroup.get(key)?.updateValueAndValidity();
    });
  }

  onShippingLocationChange(selection: Partial<LocationSelection>) {
    const shippingGroup = this.checkoutForm.get('shipping');
    shippingGroup?.patchValue({
      country: selection.country?.name || '',
      countryCode: selection.country?.isoCode || '',
      state: selection.state?.name || '',
      stateCode: selection.state?.isoCode || '',
      city: selection.city?.name || ''
    });

    this.checkoutService.updateShippingLocation(selection);

    if (this.checkoutForm.get('sameAsShipping')?.value) {
      this.syncBillingWithShipping(selection);
    }
  }

  onBillingLocationChange(selection: Partial<LocationSelection>) {
    // Update form with location data
    const billingGroup = this.checkoutForm.get('billing');
    billingGroup?.patchValue({
      country: selection.country?.name || '',
      countryCode: selection.country?.isoCode || '',
      state: selection.state?.name || '',
      stateCode: selection.state?.isoCode || '',
      city: selection.city?.name || ''
    });

    this.checkoutService.updateBillingLocation(selection);
  }

  private syncBillingWithShipping(shippingSelection?: Partial<LocationSelection>): void {
    const shippingValue = this.checkoutForm.get('shipping')?.value;
    const billingGroup = this.checkoutForm.get('billing') as FormGroup;

    // Copy all shipping data to billing
    billingGroup.patchValue(shippingValue);

    // Sync location selections in the service
    this.checkoutService.syncBillingWithShipping();
  }

  onSameAsShippingChange() {
    const sameAsShipping = this.checkoutForm.get('sameAsShipping')?.value;
    const billingGroup = this.checkoutForm.get('billing') as FormGroup;

    if (sameAsShipping) {
      // Copy shipping address to billing
      this.syncBillingWithShipping();

      // Clear billing form validation
      Object.keys(billingGroup.controls).forEach(key => {
        billingGroup.get(key)?.clearValidators();
        billingGroup.get(key)?.updateValueAndValidity();
      });
    } else {
      // Add billing form validation
      this.addBillingValidation();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.checkoutForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isNestedFieldInvalid(groupName: string, fieldName: string): boolean {
    const field = this.checkoutForm.get(`${groupName}.${fieldName}`);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.checkoutForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['email']) return 'Please enter a valid email';
    }
    return '';
  }

  getNestedFieldError(groupName: string, fieldName: string): string {
    const field = this.checkoutForm.get(`${groupName}.${fieldName}`);
    if (field?.errors) {
      if (field.errors['required']) return 'This field is required';
    }
    return '';
  }
}



/*
  private setLocationSelection(addressType: 'shipping' | 'billing', address: Partial<LocationSelection>): void {
    try {
      // Find country by name
      const country = Country.getAllCountries().find(c =>
          c.name.toLowerCase() === address.country?.name.toLowerCase() ||
          c.isoCode.toLowerCase() === address.country?.isoCode.toLowerCase()
      );

      if (!country) {
        console.warn(`Country not found: ${address.country}`);
        return;
      }

      // Find state by name within the country
      const state = State.getStatesOfCountry(country.isoCode).find(s =>
          s.name.toLowerCase() === address.state?.name.toLowerCase() ||
          s.isoCode.toLowerCase() === address.state?.isoCode.toLowerCase()
      );

      // Find city by name within the state (if state exists)
      let city = null;
      if (state) {
        city = City.getCitiesOfState(country.isoCode, state.isoCode).find(c =>
            c.name.toLowerCase() === address.city?.name.toLowerCase()
        );
      }

      // Create location selection
      const locationSelection: Partial<LocationSelection> = {
        country: country,
        state: state || null,
        city: city || null
      };

      // Update the checkout service with the location selection
      if (addressType === 'shipping') {
        this.checkoutService.updateShippingLocation(locationSelection);
      } else {
        this.checkoutService.updateBillingLocation(locationSelection);
      }

      // Store the codes in the form for reference
      const addressGroup = this.checkoutForm.get(addressType);
      addressGroup?.patchValue({
        countryCode: country.isoCode,
        stateCode: state?.isoCode || '',
      });

    } catch (error) {
      console.error(`Error setting location selection for ${addressType}:`, error);
    }
  }

  private addressesAreEqual(shipping: ShippingAddress, billing: BillingAddress): boolean {
    return shipping.fullName === billing.fullName &&
        shipping.address1 === billing.address1 &&
        shipping.address2 === billing.address2 &&
        shipping.location.city === billing.location.city &&
        shipping.location.state === billing.location.state &&
        shipping.location.country === billing.location.country &&
        shipping.postalCode === billing.postalCode;
  }
* */