import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ComentariosService {
  private apiUrl = `${environment.apiUrl}/api/comentarios`;

  constructor(private http: HttpClient) {}

  // Obtener todos los comentarios
  getComentarios(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // Enviar un nuevo comentario
  enviarComentario(comentario: any): Observable<any> {
    return this.http.post(this.apiUrl, comentario);
  }
}
