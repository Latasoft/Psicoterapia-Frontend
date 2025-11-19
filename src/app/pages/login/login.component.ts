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
    this.isLoading = true;
    this.errorMessage = ''; // Limpiar mensaje anterior

    this.authService.login(this.username, this.contrasena).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
        this.isLoading = false;
        this.router.navigateByUrl('/', { replaceUrl: true });
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Usuario o contraseña incorrectos';
        this.isLoading = false;
        // Auto-ocultar el mensaje después de 5 segundos
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
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
