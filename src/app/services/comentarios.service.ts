import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ComentariosService {
  private apiUrl = `${environment.apiUrl}/api/comentarios`;

  constructor(private http: HttpClient) {}

  // Obtener comentarios públicos (solo aprobados)
  getComentarios(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // Obtener todos los comentarios (admin)
  getComentariosAdmin(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}/admin`, { headers });
  }

  // Enviar un nuevo comentario
  enviarComentario(comentario: any): Observable<any> {
    return this.http.post(this.apiUrl, comentario);
  }

  // Aprobar comentario (admin)
  aprobarComentario(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put(`${this.apiUrl}/${id}/approve`, {}, { headers });
  }

  // Eliminar comentario (admin)
  eliminarComentario(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }
}
