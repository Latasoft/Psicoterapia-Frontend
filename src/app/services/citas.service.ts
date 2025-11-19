import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  obtenerTratamientos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tratamientos`);
  }

  obtenerHorariosDisponibles(fecha: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/horarios/disponibles/${fecha}`);
  }

  reservarCita(citaData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/citas`, citaData);
  }

  obtenerCitas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/citas`);
  }

  obtenerMisCitas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/citas/mis-citas`);
  }

  reagendarCita(citaId: string, nuevaFechaHora: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/citas/${citaId}`, { 
      appointment_datetime: nuevaFechaHora 
    });
  }

  cancelarCita(citaId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/citas/${citaId}/status`, { 
      status: 'cancelled' 
    });
  }

  confirmarCita(citaId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/citas/${citaId}/status`, { 
      status: 'confirmed' 
    });
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
