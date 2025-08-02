import {Inject, Injectable, PLATFORM_ID, signal} from '@angular/core';
import {BehaviorSubject, Observable, of, throwError} from 'rxjs';
import {CartItem, Cart, ProductWithMedia, UserPayload} from "../../types";
import {isPlatformBrowser} from "@angular/common";
import {AuthService} from "../auth/auth.service";

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly CART_STORAGE_KEY = 'shopping_cart';
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  private cartCountSubject = new BehaviorSubject<number>(0);
  public showCart = signal(false);

  user$: Observable<UserPayload>;
  user: UserPayload | null = null;

  public cart$ = this.cartSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private authService: AuthService) {
    this.user$ = this.authService.userState$;

    this.user$.subscribe(user => {
      this.user = user;
      if (user?.isAuthenticated) {
        this.loadCartFromStorage();
      } else {
        this.clearCart().subscribe();
      }
    });
  }

  private isClient(): boolean {
    return this.user?.role === 'CLIENT' && this.user?.isAuthenticated === true;
  }

  private isAuthenticated(): boolean {
    return this.user?.isAuthenticated === true;
  }

  private throwUnauthorizedError(): Observable<never> {
    return throwError(() => new Error('Unauthorized: Only client can manage cart operations'));
  }

  private throwUnauthenticatedError(): Observable<never> {
    return throwError(() => new Error('Authentication required'));
  }

  public toggleCart(event: Event) {
    // event.stopPropagation();

    if (!this.isAuthenticated()) {
      return;
    }

    if (!this.isClient()) {
      return;
    }

    this.showCart.update(value => !value)

    // Handle body scrolling
    if (this.showCart()) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }

  hideCart() {
    if (!this.isAuthenticated() || !this.isClient()) {
      return;
    }

    this.showCart.update(() => false)
    document.body.classList.remove('overflow-hidden');
  }

  // Load cart from localStorage
  private loadCartFromStorage(): void {
    if (!this.isAuthenticated() || !this.user?.id) {
      return;
    }

    try {
      if (isPlatformBrowser(this.platformId)) {
        const cartKey = `${this.CART_STORAGE_KEY}_${this.user.id}`;
        const storedCart = localStorage.getItem(cartKey);
        if (storedCart) {
          const cart: Cart = JSON.parse(storedCart);

          // Verify cart belongs to current user
          if (cart.userId !== this.user.id) {
            console.warn('Cart user mismatch, clearing cart');
            this.clearCartFromStorage();
            return;
          }

          // Convert date strings back to Date objects
          cart.createdAt = new Date(cart.createdAt);
          cart.updatedAt = new Date(cart.updatedAt);
          cart.items.forEach(item => {
            item.addedAt = new Date(item.addedAt);
          });
          this.cartSubject.next(cart);
          this.cartCountSubject.next(cart.totalItems);
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      this.clearCartFromStorage();
    }
  }

  // Save cart to localStorage
  private saveCartToStorage(cart: Cart): void {
    if (!this.user?.id) {
      console.error('Cannot save cart: User ID not available');
      return;
    }

    try {
      const cartKey = `${this.CART_STORAGE_KEY}_${this.user.id}`;
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }

  // Clear cart from localStorage
  private clearCartFromStorage(): void {
    if (!this.user?.id) {
      return;
    }

    try {
      const cartKey = `${this.CART_STORAGE_KEY}_${this.user.id}`;
      localStorage.removeItem(cartKey);
    } catch (error) {
      console.error('Error clearing cart from localStorage:', error);
    }
  }

  // Get current cart
  getCart(): Cart | null {
    if (!this.isAuthenticated()) {
      console.warn('Authentication required to access cart');
      return null;
    }

    if (!this.isClient()) {
      console.warn('Only client can access cart');
      return null;
    }
    return this.cartSubject.value;
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Create new cart
  private createNewCart(): Cart {
    if (!this.user?.id) {
      throw new Error('Cannot create cart: User ID not available');
    }

    const now = new Date();
    return {
      userId: this.user.id,
      items: [],
      totalItems: 0,
      totalAmount: 0,
      createdAt: now,
      updatedAt: now
    };
  }

  // Calculate cart totals
  private calculateCartTotals(cart: Cart): void {
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.updatedAt = new Date();
  }

  // Add item to cart
  addToCart(product: ProductWithMedia, quantity: number = 1): Observable<Cart> {
    if (!this.isAuthenticated()) {
      return this.throwUnauthenticatedError();
    }

    if (!this.isClient()) {
      return this.throwUnauthorizedError();
    }

    let cart = this.getCart();

    if (!cart) {
      cart = this.createNewCart();
    }

    const existingItemIndex = cart.items.findIndex(item => item.item.product.id === product.product.id);

    if (existingItemIndex >= 0) {
      // Update existing item
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (newQuantity <= product.product.quantity) {
        cart.items[existingItemIndex].quantity = newQuantity;
      } else {
        cart.items[existingItemIndex].quantity = product.product.quantity;
      }
    } else {
      // Add new item
      const cartItem: CartItem = {
        id: this.generateId(),
        item: product,
        quantity: Math.min(quantity, product.product.quantity),
        price: product.product.price,
        addedAt: new Date()
      };
      cart.items.push(cartItem);
    }

    this.calculateCartTotals(cart);
    this.saveCartToStorage(cart);
    this.cartSubject.next(cart);
    this.cartCountSubject.next(cart.totalItems);

    return of(cart);
  }

  // Update cart item quantity
  updateCartItem(cartItemId: string, quantity: number): Observable<Cart> {
    if (!this.isAuthenticated()) {
      return this.throwUnauthenticatedError();
    }

    if (!this.isClient()) {
      return this.throwUnauthorizedError();
    }

    const cart = this.getCart();
    if (!cart) return of(this.createNewCart());

    const itemIndex = cart.items.findIndex(item => item.id === cartItemId);
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = Math.min(quantity, cart.items[itemIndex].item.product.quantity);
      }

      this.calculateCartTotals(cart);
      this.saveCartToStorage(cart);
      this.cartSubject.next(cart);
      this.cartCountSubject.next(cart.totalItems);
    }

    return of(cart);
  }

  // Remove item from cart
  removeFromCart(cartItemId: string): Observable<Cart> {
    if (!this.isAuthenticated()) {
      return this.throwUnauthenticatedError();
    }

    if (!this.isClient()) {
      return this.throwUnauthorizedError();
    }
    const cart = this.getCart();
    if (!cart) return of(this.createNewCart());

    cart.items = cart.items.filter(item => item.id !== cartItemId);
    this.calculateCartTotals(cart);
    this.saveCartToStorage(cart);
    this.cartSubject.next(cart);
    this.cartCountSubject.next(cart.totalItems);

    return of(cart);
  }

  clearCart(): Observable<void> {
    if (!this.isAuthenticated() || !this.isClient()) return of(void 0);
    console.log('Clearing cart');
    this.clearCartFromStorage();
    this.cartSubject.next(null);
    this.cartCountSubject.next(0);
    return of(void 0);
  }

  isProductInCart(productId: string): boolean {
    if (!this.isAuthenticated() || !this.isClient()) {
      return false;
    }

    const cart = this.getCart();
    return cart ? cart.items.some(item => item.item.product.id === productId) : false;
  }

  // Get cart item by product ID
  getCartItemByProductId(productId: string): CartItem | undefined {
    if (!this.isAuthenticated() || !this.isClient()) {
      return undefined;
    }

    const cart = this.getCart();
    return cart ? cart.items.find(item => item.item.product.id === productId) : undefined;
  }

  // Get cart item count for a specific product
  getProductQuantityInCart(productId: string): number {
    const cartItem = this.getCartItemByProductId(productId);
    return cartItem ? cartItem.quantity : 0;
  }
}
