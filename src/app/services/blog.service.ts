import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private apiUrl = 'https://backend-psicologia-fckw.onrender.com/api/blog'; // Cambia a la URL de tu backend

  constructor(private http: HttpClient) { }

  // Método para crear un nuevo blog
  crearBlog(titulo: string, texto: string, imagen: string, videoUrl: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/crear`, { titulo, texto, imagen, videoUrl });
}


  // Método para obtener todos los blogs
  obtenerBlogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/obtener`).pipe(
      tap(data => console.log('Datos obtenidos:', data))  // Esto te ayudará a ver la respuesta en la consola
    );
  }
  eliminarBlog(id: string): Observable<any> {
  return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
}
 
  
  editarBlog(id: string, blog: any) {
    return this.http.put(`${this.apiUrl}/editar/${id}`, blog);
  }
  
}
