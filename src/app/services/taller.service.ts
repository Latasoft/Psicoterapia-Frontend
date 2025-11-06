import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TallerService {
  private apiUrl = `${environment.apiUrl}/api/taller`;

  constructor(private http: HttpClient) {}

  crearTaller(tallerData: any) {
    return this.http.post(`${this.apiUrl}/crear`, tallerData);
  }
  getTalleres() {
  return this.http.get<any[]>(`${this.apiUrl}/lista`);
}

  editarTaller(id: string, tallerData: any) {
    return this.http.put(`${this.apiUrl}/editar/${id}`, tallerData);
  }
  eliminarTaller(id: string) {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }

}
