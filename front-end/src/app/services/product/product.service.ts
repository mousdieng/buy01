import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {
    ApiResponse, AvailableProductRequest,
    CreateProduct,
    HttpParamsProductsSearch,
    PaginatedResponse, Product, ProductBase,
    ProductWithMedia
} from "../../types";
import {forkJoin, Observable, of, switchMap} from "rxjs";
import {TokenService} from "../token/token.service";
import {MediaService} from "../media/media.service";
import {map} from "rxjs/operators";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl = environment.apiUrl + 'product';

  constructor(
      private http: HttpClient,
      private tokenService: TokenService,
      private mediaService: MediaService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.tokenService.token;
    return new HttpHeaders({
      'Authorization': `Bearer ${token?.accessToken}`,
      'Content-Type': 'application/json'
    });
  }

  getProductById(id: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(
        `${this.baseUrl}/${id}`,
        { headers: { 'Content-Type': 'application/json' }}
    );
  }

  getProductByIdEvenDeletedOrNoneActive(id: string): Observable<ApiResponse<Product>> {
      return this.http.get<ApiResponse<Product>>(
          `${this.baseUrl}/${id}/all`,
          { headers: { 'Content-Type': 'application/json' }}
      );
  }

  getProductsByUserId(userId: string, page: number = 0, size: number = 10): Observable<ApiResponse<PaginatedResponse<Product>>> {
    return this.http.get<ApiResponse<PaginatedResponse<Product>>>(
        `${this.baseUrl}/users/${userId}?page=${page}&size=${size}`,
        { headers: { 'Content-Type': 'application/json' }}
    );
  }

  getSingleProductsMedia(productId: string): Observable<ApiResponse<ProductWithMedia>> {
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

  searchProducts(params: HttpParamsProductsSearch): Observable<ApiResponse<PaginatedResponse<ProductWithMedia>>> {
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
                    map((fullProductsArray: ProductWithMedia[]) => ({
                        status: productsResponse.status,
                        message: productsResponse.message,
                        data: {
                            ...productsResponse.data,
                            content: fullProductsArray,
                        }
                    }))
                );
            })
      );
    }

  getProductsWithMediaByUserId(userId: string, page: number = 0, size: number = 10): Observable<ApiResponse<PaginatedResponse<ProductWithMedia>>> {
    return this.getProductsByUserId(userId, page, size).pipe(
        switchMap(productsResponse => {
          const products = productsResponse.data.content;
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
                    ...productsResponse.data,
                    content: productMediaArray,
                }
              }))
          );
        })
    );
  }

  createProduct(product: CreateProduct): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.baseUrl}/`, product, { headers: this.getAuthHeaders() });
  }

  updateProduct(id: string, updates: ProductBase): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.baseUrl}/${id}`, updates, { headers: this.getAuthHeaders() });
  }

  deleteProduct(id: string): Observable<ApiResponse<Product>> {
    return this.http.delete<ApiResponse<Product>>(`${this.baseUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  productAvailable(product: AvailableProductRequest[]): Observable<ApiResponse<Product[]>> {
      return this.http.post<ApiResponse<Product[]>>(`${this.baseUrl}/available`, product, { headers: this.getAuthHeaders() });
  }
}
