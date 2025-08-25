import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TallerService {
  private apiUrl = 'https://backend-psicologia-fckw.onrender.com/api/taller'; // Ajusta esto si cambia tu ruta

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
