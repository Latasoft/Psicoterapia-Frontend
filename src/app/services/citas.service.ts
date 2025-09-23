import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private apiUrl = `${environment.apiUrl}/api/citas`;

  constructor(private http: HttpClient) {}

  obtenerTratamientos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tratamientos`);
  }

  obtenerHorariosDisponibles(fecha: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/horarios-disponibles?fecha=${fecha}`);
  }

  reservarCita(citaData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reservar`, citaData);
  }

  obtenerCitas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ver`);
  }

  reagendarCita(citaId: string, nuevaFechaHora: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/reagendar/${citaId}`, { 
      nuevaFechaHora: nuevaFechaHora 
    });
  }

  cancelarCita(citaId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cancelar/${citaId}`);
  }

  // Método para actualizar un tratamiento
  actualizarTratamiento(tratamientoId: string, tratamientoData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/tratamientos/${tratamientoId}`, tratamientoData);
  }

  // Método para crear un nuevo tratamiento
  crearTratamiento(tratamientoData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tratamientos`, tratamientoData);
  }

  // Método para eliminar un tratamiento
  eliminarTratamiento(tratamientoId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tratamientos/${tratamientoId}`);
  }

  // Método para notificar a Matías sobre nueva reservación
  notificarReservacion(citaData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/notificar-reservacion`, citaData);
  }
}
