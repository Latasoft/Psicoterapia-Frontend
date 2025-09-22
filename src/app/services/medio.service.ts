// src/app/services/media.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private apiUrl = `${environment.apiUrl}/api/media`;

  constructor(private http: HttpClient) {}

  uploadMedia(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  deleteMedia(mediaKey: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${mediaKey}`);
  }
}