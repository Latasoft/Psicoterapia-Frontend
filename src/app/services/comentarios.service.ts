import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComentariosService {
  private apiUrl = 'http://localhost:3000/api/comentarios'; // Ruta de tu backend

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
