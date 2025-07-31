import { CommonModule } from '@angular/common';
import {Component, HostListener, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterLink, RouterLinkActive} from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { UserPayload } from '../../../types';
import { CartService } from "../../../services/cart/cart.service";
import { AuthService } from "../../../services/auth/auth.service";
import {filter} from "rxjs/operators";
import { environment } from "../../../../environments/environment";
import {CartComponent} from "../../cart/cart.component";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink, RouterLinkActive, AvatarModule, BadgeModule, CartComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})

export class NavbarComponent implements OnInit {
  isMenuOpen = false;
  user: UserPayload = { id: '', name: '', email: '', avatar: null, role: null, isAuthenticated: false };
  cartCount = 0;
  isAuthPage: boolean = false;

  constructor(
      private router: Router,
      private authService: AuthService,
      private cartService: CartService,
      ) {
    this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          const currentUrl = event.urlAfterRedirects;
          this.isAuthPage = currentUrl.includes('/sign-in') || currentUrl.includes('/sign-up');
        });
  }

  ngOnInit(): void {
    this.authService.userState$.subscribe((u) => {
      this.user = u;
    });
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) this.cartService.hideCart()

    // Handle body scrolling
    if (this.isMenuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }

  // Close menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const navElement = document.querySelector('nav');
    const menuButton = document.querySelector('button');

    if (this.isMenuOpen &&
        navElement &&
        !navElement.contains(target) &&
        menuButton &&
        !menuButton.contains(target)) {
      this.isMenuOpen = false;
      document.body.classList.remove('overflow-hidden');
    }
  }

  logOut(event: Event) {
    this.authService.logout();
    this.toggleMenu(event);
  }

  protected readonly environment = environment;
}