import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { JwtHelperService } from '@auth0/angular-jwt';
import {ApiResponse, TokenPayload, Tokens, User, UserPayload} from "../../types";
import {HttpClient, HttpHeaders, HttpStatusCode} from "@angular/common/http";
import {Observable, of} from "rxjs";
import {catchError, map} from "rxjs/operators";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private API_URL = environment.apiUrl + "user";
  private readonly STORAGE_NAME: string = "BUY_01"

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient, private jwtHelper: JwtHelperService ) {}

  set token(token: Tokens) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.STORAGE_NAME, JSON.stringify(token));
    }
  }

  get token(): Tokens | null {
    if (isPlatformBrowser(this.platformId)) {
      const storedToken = localStorage.getItem(this.STORAGE_NAME);
      return storedToken ? JSON.parse(storedToken) : null;
    }
    return null;
  }

  remove() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.STORAGE_NAME);
    }
  }

    isTokenValid(): Observable<UserPayload | null> {
        const tokenPayload: TokenPayload | null = this.parse();
        if (!tokenPayload || !tokenPayload.user) {
            this.remove(); // Clean up invalid token
            return of(null);
        }

        const currentToken = this.token;
        if (!currentToken?.accessToken) {
            this.remove(); // Clean up missing access token
            return of(null);
        }

        return this.http
            .get<ApiResponse<User>>(`${this.API_URL}/${tokenPayload.user.id}`, {
                headers: {
                    'Authorization': `Bearer ${currentToken.accessToken}`,
                    'Content-Type': 'application/json'
                }
            })
            .pipe(
                map(response => {
                    const isAuthenticated = response.status === HttpStatusCode.Ok;
                    if (!isAuthenticated) {
                        this.remove(); // Clean up on non-OK response
                        return null;
                    }

                    // Return user payload with signature (user ID) and authentication status
                    return {
                        ...tokenPayload.user,
                        isAuthenticated
                    };
                }),
                catchError((error) => {
                    if (error.status === HttpStatusCode.Unauthorized ||
                        error.status === HttpStatusCode.Forbidden ||
                        error.status === 401 ||
                        error.status === 403) {
                        this.remove();
                    }

                    return of(null);
                })
            );
    }

    parse(): TokenPayload | null {
        const token = this.token?.accessToken;
        if (!token) return null;

        try {
            const decoded = this.jwtHelper.decodeToken(token);

            // Check if token is expired
            if (this.jwtHelper.isTokenExpired(token)) {
                this.remove();
                return null;
            }

            return decoded;
        } catch (error) {
            this.remove();
            return null;
        }
    }

    // Helper method to check if user is authenticated
    isAuthenticated(): boolean {
        const tokenPayload = this.parse();
        return !!tokenPayload && !!tokenPayload.user;
    }
}
