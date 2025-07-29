import {ProductMedia} from "./product";

export interface CartItem {
    id: string;
    item: ProductMedia;
    quantity: number;
    price: number;
    addedAt: Date;
}

export interface Cart {
    userId: string;
    items: CartItem[];
    totalItems: number;
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface AddToCartRequest {
    productId: string;
    quantity: number;
}

