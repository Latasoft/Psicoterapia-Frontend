import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PageContentService {
  private apiUrl = `${environment.apiUrl}/api/page-content`;
  
  constructor(private http: HttpClient) {}

  // Obtener contenido de página
  getPageContent(pageId: string): Observable<any> {
    console.log(`🔍 Fetching content for page: ${pageId}`);
    return this.http.get(`${this.apiUrl}/${pageId}`);
  }

  // Actualizar contenido de página
  updatePageContent(pageId: string, content: any): Observable<any> {
    console.log(`💾 Updating content for page: ${pageId}`);
    return this.http.put(`${this.apiUrl}/${pageId}`, content);
  }
}