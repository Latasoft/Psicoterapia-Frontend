import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PageContentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Obtener contenido de página
  getPageContent(pageId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/page-content/${pageId}`);
  }

  // Actualizar contenido de página
  updatePageContent(pageId: string, content: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/page-content/${pageId}`, content);
  }

  // Obtener URLs de media
  getMediaUrls(): Observable<any> {
    return this.http.get(`${this.apiUrl}/media/urls`);
  }

  // Actualizar URL de media
  updateMediaUrl(mediaKey: string, url: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/media/url/${mediaKey}`, { url });
  }

  // Eliminar media (restaurar por defecto)
  deleteMedia(mediaKey: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/media/${mediaKey}`);
  }
}