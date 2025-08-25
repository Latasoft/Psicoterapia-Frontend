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

  // Método para alternar el menú
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    console.log('Menu toggled:', this.isMenuOpen);  // Verifica si se está alternando correctamente en la consola
  }
  isLoggedIn = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;
    });

    this.authService.checkLogin(); // 👈 Esto verifica si hay token al cargar
  }

  logout() {
    this.authService.logout();
    window.location.href = '/'; // o usa router.navigate(['/']);
  }
}
