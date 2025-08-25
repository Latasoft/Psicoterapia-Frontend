import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true, // <-- IMPORTANTE si estás usando Angular standalone components
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  contrasena: string = '';
  errorMessage: string = '';
  isLoading: boolean = false; // Loader para inicio y cierre de sesión

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    this.isLoading = true; // Mostrar loader al iniciar

    this.authService.login(this.username, this.contrasena).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token); // Guarda el token
        this.isLoading = false; // Ocultar loader
        this.router.navigateByUrl('/menu-admin', { replaceUrl: true }); // Redirigir
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al iniciar sesión.';
        this.isLoading = false; // También ocultar loader si hay error
      }
    });
  }

  onLogout(): void {
    this.isLoading = true; // Mostrar loader en logout

    setTimeout(() => {
      localStorage.removeItem('token'); // Borra el token
      this.isLoading = false; // Ocultar loader
      this.router.navigate(['/']); // Redirige a la página de inicio o login
    }, 1500); // Tiempo simulado de cierre de sesión
  }
}
