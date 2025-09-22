import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private apiUrl = `${environment.apiUrl}/api/images`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    console.log('🔐 Getting auth headers, token present:', !!token);
    
    if (token) {
      console.log('📤 Sending Authorization header with token');
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    } else {
      console.log('⚠️ No token found, sending empty headers');
      return new HttpHeaders();
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      errorMessage = `Error ${error.status}: ${error.message}`;
      if (error.status === 404) {
        errorMessage = 'Servicio no encontrado. Verifica que el backend esté ejecutándose.';
      } else if (error.status === 0) {
        errorMessage = 'No se puede conectar al servidor. Verifica CORS y conectividad.';
      }
    }
    
    console.error('ImageService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  uploadImage(file: File, folder: string): Observable<any> {
    const formData = new FormData();
    formData.append('imagen', file);
    
    return this.http.post(`${this.apiUrl}/upload/${folder}`, formData, {
      headers: this.getAuthHeaders()
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  uploadVideo(file: File, folder: string): Observable<any> {
    console.log('🎥 ImageService.uploadVideo called');
    console.log('📁 Folder:', folder);
    console.log('📄 File:', file.name, file.type, file.size);
    
    const formData = new FormData();
    formData.append('video', file);
    
    const headers = this.getAuthHeaders();
    console.log('📤 Headers prepared for video upload');
    
    return this.http.post(`${this.apiUrl}/upload-video/${folder}`, formData, {
      headers: headers
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  uploadBlogImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('imagen', file);
    
    return this.http.post(`${this.apiUrl}/blog`, formData, {
      headers: this.getAuthHeaders()
    }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  deleteImage(publicId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${encodeURIComponent(publicId)}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getFolderImages(folder: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/folder/${folder}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getOptimizedImageUrl(publicId: string, width: number = 300, height: number = 200): string {
    return `${this.apiUrl}/optimized/${encodeURIComponent(publicId)}?width=${width}&height=${height}`;
  }

  // Método para probar la conexión
  testConnection(): Observable<any> {
    return this.http.get(`${this.apiUrl}/test`).pipe(
      catchError(this.handleError)
    );
  }
}