import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PageContentService {
  private apiUrl = `${environment.apiUrl}/api/page-content`;
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };
  
  constructor(private http: HttpClient) {}

  // Obtener contenido de página
  getPageContent(pageId: string): Observable<any> {
    console.log(`🔍 Fetching content for page: ${pageId}`);
    return this.http.get(`${this.apiUrl}/${pageId}`);
  }

  // Actualizar contenido de página
  updatePageContent(pageId: string, content: any): Observable<any> {
    console.log(`💾 Updating content for page: ${pageId}`, content);
    console.log(`📤 Sending to: ${this.apiUrl}/${pageId}`);
    return this.http.put(`${this.apiUrl}/${pageId}`, content, this.httpOptions);
  }

  // Actualizar múltiples campos de forma eficiente (batch update)
  batchUpdateContent(pageId: string, updates: { [contentId: string]: any }): Observable<any> {
    console.log(`🔄 Batch updating ${Object.keys(updates).length} fields for page: ${pageId}`);
    return this.http.patch(`${this.apiUrl}/${pageId}/batch`, { updates }, this.httpOptions);
  }
}
