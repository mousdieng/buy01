import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpStatusCode } from "@angular/common/http";
import { catchError, map, Observable, throwError } from "rxjs";
import { TokenService } from "../token/token.service";
import { MediaService } from "../media/media.service";
import { ApiResponse, PaginatedResponse, Product, Tokens, User } from "../../types";
import { environment } from "../../../environments/environment";
import {AuthService} from "../auth/auth.service";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private API_URL = environment.apiUrl + "user";

  constructor(
      private http: HttpClient,
      private tokenService: TokenService,
      private mediaService: MediaService,
      private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.tokenService.token;
    return new HttpHeaders({
      'Authorization': `Bearer ${token?.accessToken}`
    });
  }

  getUserById(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(
        `${this.API_URL}/${id}`,
        { headers: this.getAuthHeaders() }
    ).pipe(
        catchError(error => {
          console.error('Error fetching user:', error);
          return throwError(() => new Error('Failed to fetch user. Please try again later.'));
        })
    );
  }

  getUserByIdEvenDeleted(id: string): Observable<ApiResponse<User>> {
      return this.http.get<ApiResponse<User>>(
          `${this.API_URL}/${id}/all`,
          { headers: this.getAuthHeaders() }
      ).pipe(
          catchError(error => {
              console.error('Error fetching user:', error);
              return throwError(() => new Error('Failed to fetch user. Please try again later.'));
          })
      );
  }

  updateUser(userId: string, user: FormData): Observable<ApiResponse<Tokens> | null> {
      return this.http
        .put<ApiResponse<Tokens>>(`${this.API_URL}/${userId}`, user, {
          headers: this.getAuthHeaders(),
          reportProgress: true,
          observe: 'response'
        })
        .pipe(
            map(response => {
              const body = response.body;
              if (body?.data && HttpStatusCode.Ok === body.status) {
                this.authService.updateUserState(body.data);
              }
              return body;
            }),
            catchError(error => {
              console.error('Error updating user:', error);
              return throwError(() => new Error('Failed to update user. Please try again later.'));
            })
        );
  }

  deleteUser(userId: string): Observable<ApiResponse<User>> {
    return this.http
        .delete<ApiResponse<User>>(`${this.API_URL}/${userId}`, {
          headers: this.getAuthHeaders()
        })
        .pipe(
            map(response => {
              // If the user deleted themselves, log them out
              if (userId === this.tokenService.parse()?.user.id) {
                this.authService.logout();
              }
              return response;
            }),
            catchError(error => {
              console.error('Error deleting user:', error);
              return throwError(() => new Error('Failed to delete user. Please try again later.'));
            })
        );
  }

  getAllUsers(page: number = 1, limit: number = 10): Observable<PaginatedResponse<User>> {
    return this.http.get<PaginatedResponse<User>>(
        `${this.API_URL}?page=${page}&limit=${limit}`,
        { headers: this.getAuthHeaders() }
    ).pipe(
        catchError(error => {
          console.error('Error fetching users:', error);
          return throwError(() => new Error('Failed to fetch users. Please try again later.'));
        })
    );
  }
}