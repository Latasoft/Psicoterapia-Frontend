import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

interface LoginResponse {
  token: string;
  user: {
    username: string;
    role: string;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/api/login`;
  private loggedIn = new BehaviorSubject<boolean>(false);
  private userRole = new BehaviorSubject<string | null>(null);
  
  public isLoggedIn$ = this.loggedIn.asObservable();
  public userRole$ = this.userRole.asObservable();

  constructor(private http: HttpClient) {}

  login(username: string, contrasena: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, { username, contrasena }).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          
          // Decodificar token para extraer el rol
          const payload = this.decodeToken(response.token);
          const role = payload?.role || response.user?.role || 'usuario';
          
          localStorage.setItem('userRole', role);
          this.loggedIn.next(true);
          this.userRole.next(role);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    this.loggedIn.next(false);
    this.userRole.next(null);
  }

  checkLogin() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    this.loggedIn.next(!!token);
    this.userRole.next(role);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUserRole(): string | null {
    return localStorage.getItem('userRole');
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  isUsuario(): boolean {
    return this.getUserRole() === 'usuario';
  }

  register(username: string, email: string, contrasena: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { 
      username, 
      email, 
      contrasena, 
      role: 'usuario' 
    });
  }

  // Decodifica el token JWT (sin verificar firma, solo para leer el payload)
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  }
  
}
