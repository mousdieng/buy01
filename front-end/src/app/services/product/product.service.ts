import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {
    ApiResponse, AvailableProductRequest,
    CreateProduct,
    FullProduct,
    HttpParamsProductsSearch,
    PaginatedResponse,
    Product,
    ProductMedia
} from "../../types";
import {forkJoin, Observable, of, switchMap} from "rxjs";
import {TokenService} from "../token/token.service";
import {MediaService} from "../media/media.service";
import {map} from "rxjs/operators";
import {UserService} from "../user/user.service";
import {environment} from "../../environment";

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl = environment.apiUrl + 'product';

  constructor(
      private http: HttpClient,
      private tokenService: TokenService,
      private mediaService: MediaService,
      private userService: UserService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.tokenService.token;
    return new HttpHeaders({
      'Authorization': `Bearer ${token?.accessToken}`,
      'Content-Type': 'application/json'
    });
  }

  // Get product by ID
  getProductById(id: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(
        `${this.baseUrl}/${id}`,
        { headers: { 'Content-Type': 'application/json' }}
    );
  }

  // Get products by user ID with pagination
  getProductsByUserId(userId: string, page: number = 0, size: number = 10): Observable<ApiResponse<PaginatedResponse<Product>>> {
    return this.http.get<ApiResponse<PaginatedResponse<Product>>>(
        `${this.baseUrl}/users/${userId}?page=${page}&size=${size}`,
        { headers: { 'Content-Type': 'application/json' }}
    );
  }

  getSingleProductsMedia(productId: string): Observable<ApiResponse<ProductMedia>> {
        return this.getProductById(productId).pipe(
            switchMap(productsResponse => {
                const product: Product = productsResponse.data;

                return forkJoin({
                    media: this.mediaService.getMediaByProductId(product.id).pipe(
                        map(mediaResponse => mediaResponse.data)
                    )
                }).pipe(
                    map(({ media }) => ({
                        product,
                        media
                    })),
                    map(fullProduct => ({
                        status: 200,
                        message: 'product fetched successfully',
                        data: fullProduct,
                    }))
                );
            })
        );
    }

  searchProducts(params: HttpParamsProductsSearch): Observable<ApiResponse<PaginatedResponse<ProductMedia>>> {
      let httpParams = new HttpParams();

      if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
      if (params.name) httpParams = httpParams.set('name', params.name);

      // Handle single price or price range
      if (params.price) httpParams = httpParams.set('price', params.price);
      if (params.priceMin !== undefined) httpParams = httpParams.set('priceMin', params.priceMin.toString());
      if (params.priceMax !== undefined) httpParams = httpParams.set('priceMax', params.priceMax.toString());

      // Handle single quantity or quantity range
      if (params.quantity) httpParams = httpParams.set('quantity', params.quantity);
      if (params.quantityMin !== undefined) httpParams = httpParams.set('quantityMin', params.quantityMin.toString());
      if (params.quantityMax !== undefined) httpParams = httpParams.set('quantityMax', params.quantityMax.toString());

      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());

      return this.http.get<ApiResponse<PaginatedResponse<Product>>>(
          `${this.baseUrl}/search`,
          {
              headers: {'Content-Type': 'application/json'},
              params: httpParams
          }
        ).pipe(
          switchMap(productsResponse => {
                const products: Product[] = productsResponse.data.content;
                if (products.length === 0) {
                    return of({
                        status: productsResponse.status,
                        message: productsResponse.message,
                        data: {
                            content: [],
                            page: productsResponse.data.page
                        }
                    });
                }

                const mediaRequests = products.map(product =>
                    forkJoin({
                        media: this.mediaService.getMediaByProductId(product.id).pipe(
                            map(mediaResponse => mediaResponse.data)
                        )
                    }).pipe(
                        map(({ media }) => ({
                            product,
                            media
                        }))
                    )
                );

                return forkJoin(mediaRequests).pipe(
                    map((fullProductsArray: ProductMedia[]) => ({
                        status: productsResponse.status,
                        message: productsResponse.message,
                        data: {
                            content: fullProductsArray,
                            page: productsResponse.data.page
                        }
                    }))
                );
            })
      );
    }

  getProductsWithMediaByUserId(userId: string, page: number = 0, size: number = 10): Observable<ApiResponse<PaginatedResponse<ProductMedia>>> {
    return this.getProductsByUserId(userId, page, size).pipe(
        switchMap(productsResponse => {
          const products = productsResponse.data.content;
          if (products.length === 0) {
                return of({
                    status: productsResponse.status,
                    message: productsResponse.message,
                    data: {
                        content: [],
                        page: productsResponse.data.page
                    }
                })
          }
          const mediaRequests = products.map(product =>
              this.mediaService.getMediaByProductId(product.id).pipe(
                  map(mediaResponse => ({
                    product,
                    media: mediaResponse.data
                  }))
              )
          );

          return forkJoin(mediaRequests).pipe(
              map(productMediaArray => ({
                status: productsResponse.status,
                message: productsResponse.message,
                data: {
                  content: productMediaArray,
                  page: productsResponse.data.page
                }
              }))
          );
        })
    );
  }

  createProduct(product: CreateProduct): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.baseUrl}/`, product, { headers: this.getAuthHeaders() });
  }

  updateProduct(id: string, updates: Product): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.baseUrl}/${id}`, updates, { headers: this.getAuthHeaders() });
  }

  deleteProduct(id: string): Observable<ApiResponse<Product>> {
    return this.http.delete<ApiResponse<Product>>(`${this.baseUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  productAvailable(product: AvailableProductRequest[]): Observable<ApiResponse<Product[]>> {
      return this.http.post<ApiResponse<Product[]>>(`${this.baseUrl}/available`, product, { headers: this.getAuthHeaders() });
  }

    updateProductQuantity(product: AvailableProductRequest[]) {
        return this.http.put<ApiResponse<Product[]>>(`${this.baseUrl}/quantity-update`, product, { headers: this.getAuthHeaders() });
    }
}
