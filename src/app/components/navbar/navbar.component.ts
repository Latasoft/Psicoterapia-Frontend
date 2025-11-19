import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-navbar',
    imports: [RouterModule, CommonModule],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  isMenuOpen = false;
  isLoading: boolean = false; 
  isLoggedIn = false;
  userRole: string | null = null;

  // Método para alternar el menú
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    console.log('Menu toggled:', this.isMenuOpen);
  }

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;
    });

    this.authService.userRole$.subscribe((role) => {
      this.userRole = role;
    });

    this.authService.checkLogin();
  }

  isAdmin(): boolean {
    return this.userRole === 'admin';
  }

  isUsuario(): boolean {
    return this.userRole === 'usuario';
  }

  logout() {
    this.authService.logout();
    window.location.href = '/';
  }
}
