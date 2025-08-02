import {Media, User} from "./index";

export interface ProductBase {
    id: string;
    name: string;
    description: string;
    price: number;
    quantity: number;
    userID: string;
}

export interface Product extends ProductBase {
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface AvailableProductRequest {
    id: string;
    quantity: number;
}

export interface HttpParamsProductsSearch {
    keyword?: string;
    name?: string;

    // Single value filters (backward compatibility)
    price?: string;
    quantity?: string;

    // Range filters
    priceMin?: number;
    priceMax?: number;
    quantityMin?: number;
    quantityMax?: number;

    // Sorting
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';

    // pagination
    page?: number;
    size?: number;
}

export interface ProductWithMedia {
    product: Product;
    media: Media[]
}

export interface ProductWithUserAndMedia {
    user: User,
    product: Product,
    media: Media[]
}

export interface CreateProduct {
    name: string;
    description: string;
    price: number;
    quantity: number;
}