import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/api/login`;  // URL cambiar cuando haga push por esto   private apiUrl = `${environment.apiUrl}/login`; 
  private loggedIn = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.loggedIn.asObservable();

  constructor(private http: HttpClient) {}

  login(username: string, contrasena: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { username, contrasena }).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          this.loggedIn.next(true);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    this.loggedIn.next(false);
  }

  checkLogin() {
    const token = localStorage.getItem('token');
    this.loggedIn.next(!!token);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
  
}
