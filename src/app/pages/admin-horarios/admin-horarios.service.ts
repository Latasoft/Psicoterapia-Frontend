import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminHorariosService {
  private apiUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    } else {
      return new HttpHeaders();
    }
  }

  getHorarios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/horarios`, { headers: this.getAuthHeaders() });
  }

  actualizarHorarios(horarioSemanal: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/horarios`, horarioSemanal, { headers: this.getAuthHeaders() });
  }

  getDisponiblesPorFecha(fecha: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/horarios/disponibles/${fecha}`, { headers: this.getAuthHeaders() });
  }

  crearExcepcion(excepcion: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/excepciones`, excepcion, { headers: this.getAuthHeaders() });
  }

  eliminarExcepcion(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/excepciones/${id}`, { headers: this.getAuthHeaders() });
  }
}
