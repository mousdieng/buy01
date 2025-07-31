import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpStatusCode} from '@angular/common/http';
import { TokenService } from '../token/token.service';
import { Router } from '@angular/router';
import {ApiResponse, TokenPayload, Tokens, User, UserLoginRequest, UserPayload} from "../../types";
import { take } from "rxjs/operators";
import { environment } from "../../../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private defaultUserPayload: UserPayload = {id: '', name: '', email: '', avatar: null, role: null, isAuthenticated: false};

    private API_URL = environment.apiUrl + "user";
    private user = new BehaviorSubject<UserPayload>(this.defaultUserPayload);
    public userState$: Observable<UserPayload> = this.user.asObservable();
    public initializationComplete$ = new BehaviorSubject<boolean>(false);
    private refreshTokenInProgress = false;
    private refreshTokenSubject = new BehaviorSubject<Tokens | null>(null);

    constructor(
        private http: HttpClient,
        private tokenService: TokenService,
        private router: Router
    ) {
        this.initialize().then(() => {
            this.initializationComplete$.next(true);
        });
    }

    private async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.tokenService.isTokenValid().pipe(take(1)).subscribe({
                next: user => {
                    console.log('User is authenticated:', user);
                    if (user) {
                        this.user.next({ ...user, isAuthenticated: true });
                    } else {
                        this.user.next(this.defaultUserPayload);
                    }
                    resolve();
                },
                error: error => {
                    console.error('Error during initialization:', error);
                    this.user.next(this.defaultUserPayload);
                    reject(error);
                }
            });
        });
    }

    register(user: FormData): Observable<ApiResponse<Tokens> | null> {
        console.log("user", user)
        return this.http
            .post<ApiResponse<Tokens>>(`${this.API_URL}/auth/register`, user, {
                reportProgress: true,
                observe: 'response'
            })
            .pipe(
                map(response => {
                    const body = response.body;
                    if (body?.data && body.status === HttpStatusCode.Created) {
                        this.updateUserState(body.data);
                    }
                    return body;
                }),
                catchError((error: HttpErrorResponse) => {
                    console.error('Registration error:', error);
                    return throwError(() => new Error(error.error?.message || 'Registration failed. Please try again.'));
                })
            );
    }

    login(userLoginRequest: UserLoginRequest): Observable<ApiResponse<Tokens> | null> {
        return this.http
            .post<ApiResponse<Tokens>>(`${this.API_URL}/auth/login`, userLoginRequest, {
                reportProgress: true,
                observe: 'response'
            })
            .pipe(
                map(response => {
                    const body = response.body;
                    if (body?.data && HttpStatusCode.Ok === body.status) {
                        this.updateUserState(body.data);
                    }
                    return body;
                }),
                catchError((error: HttpErrorResponse) => {
                    console.error('Login error:', error);
                    return throwError(() => new Error(error.error?.message || 'Login failed. Please check your credentials.'));
                })
            );
    }

    // New method for UserService to update tokens and user state
    updateUserState(tokens: Tokens): void {
        this.tokenService.token = tokens;
        const tokenPayload: TokenPayload | null = this.tokenService.parse();
        if (!tokenPayload || !tokenPayload.user) throw Error("Unable to parse the token.");
        this.user.next({ ...tokenPayload.user, isAuthenticated: true });
    }

    logout(): void {
        this.clearUserState();
    }

    private clearUserState(): void {
        this.router.navigate(['/auth/sign-in']);
        this.user.next(this.defaultUserPayload);
        this.tokenService.remove();
    }

    refreshToken(): Observable<Tokens | null> {
        if (this.refreshTokenInProgress) {
            return this.refreshTokenSubject.pipe(
                map(token => token),
                catchError(() => of(null))
            );
        }

        this.refreshTokenInProgress = true;
        this.refreshTokenSubject.next(null);

        const refreshToken = this.tokenService.token?.refreshToken;
        if (!refreshToken) {
            this.refreshTokenInProgress = false;
            return of(null);
        }

        return this.http
            .post<ApiResponse<Tokens>>(`${this.API_URL}/auth/refresh`, { refreshToken })
            .pipe(
                map(response => {
                    if (response?.data) {
                        this.updateUserState(response.data);
                        this.refreshTokenSubject.next(response.data);
                        return response.data;
                    }
                    return null;
                }),
                catchError(error => {
                    console.error('Error refreshing token:', error);
                    this.logout();
                    return of(null);
                }),
                finalize(() => {
                    this.refreshTokenInProgress = false;
                })
            );
    }

    isAuthenticated(): boolean {
        return this.user.value.isAuthenticated;
    }

    isSeller(): boolean {
        return this.user.value.role === 'SELLER';
    }

    hasRole(role: string | string[]): boolean {
        const userRole = this.user.value.role;
        if (!userRole) return false;

        if (Array.isArray(role)) {
            return role.includes(userRole);
        }

        return userRole === role;
    }
}