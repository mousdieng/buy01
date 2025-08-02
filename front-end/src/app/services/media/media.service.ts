import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {TokenService} from "../token/token.service";
import {Observable} from "rxjs";
import {ApiResponse, Media, PaginatedResponse, Product} from "../../types";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private readonly baseUrl = environment.apiUrl + 'media';

  constructor(private http: HttpClient, private tokenService: TokenService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.tokenService.token;
    return new HttpHeaders({
      'Authorization': `Bearer ${token?.accessToken}`,
      'Content-Type': 'application/json'
    });
  }

  getMedia(productId: string, mediaId: string): string | null {
    if (!productId || !mediaId) return null;
    return `${this.baseUrl}/${productId}/${mediaId}`
  }

  // Get product by ID
  getMediaById(id: string): Observable<ApiResponse<Media>> {
    return this.http.get<ApiResponse<Media>>(
        `${this.baseUrl}/${id}`,
        { headers: { 'Content-Type': 'application/json' }}
    );
  }

  // Get products by user ID with pagination
  getMediaByProductId(productId: string): Observable<ApiResponse<Media[]>> {
    return this.http.get<ApiResponse<Media[]>>(
        `${this.baseUrl}/product/${productId}`,
        { headers: { 'Content-Type': 'application/json' }}
    );
  }

  getMediaByProductIdEvenDeleted(productId: string): Observable<ApiResponse<Media[]>> {
    return this.http.get<ApiResponse<Media[]>>(
        `${this.baseUrl}/product/${productId}/all`,
        { headers: { 'Content-Type': 'application/json' }}
    );
  }

  // Create a new product
  createMedia(productId: string, formdata: FormData): Observable<ApiResponse<Media>> {
    return this.http.post<ApiResponse<Media>>(`${this.baseUrl}/${productId}`, formdata, { headers: {
        "Authorization": `Bearer ${this.tokenService.token?.accessToken}`}
    });
  }

  // Update an existing product
  updateMedia(id: string, updates: FormData): Observable<ApiResponse<Media>> {
    return this.http.put<ApiResponse<Media>>(`${this.baseUrl}/${id}`, updates,
          { headers: {"Authorization": `Bearer ${this.tokenService.token?.accessToken}`}
        });
  }

  // Delete a product
  deleteMedia(id: string): Observable<ApiResponse<Media>> {
    return this.http.delete<ApiResponse<Media>>(`${this.baseUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // uploadMedia(files: FileList) {
  //   const formData = new FormData();
  //   Array.from(files).forEach(file => formData.append('files', file));
  //   return this.http.post(`${this.apiUrl}/upload`, formData);
  // }
}
