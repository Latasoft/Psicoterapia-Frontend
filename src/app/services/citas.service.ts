import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CitasService {

  private apiUrl = 'https://backend-psicologia-fckw.onrender.com/api/citas';


  constructor(private http: HttpClient) { }

  // https://backend-psicologia-fckw.onrender.com
  reservarCita(datosReserva: any): Observable<any> {
    console.log('Datos para reservar:', datosReserva);
    return this.http.post(`${this.apiUrl}/reservar`, datosReserva);
  }

  // Método para obtener todas las citas
  obtenerCitas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ver`);
  }

  // Reagendar la cita
  reagendarCita(citaId: string, nuevaFechaHora: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/reagendar/${citaId}`, { nueva_fecha_hora: nuevaFechaHora });
  }

  // Cancelar cita
  cancelarCita(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cancelar/${id}`);

  }
  // Obtener horarios disponibles para una fecha específica
  obtenerHorariosDisponibles(fecha: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/horarios-disponibles`, {
      params: { fecha }
    });
  }


  // ================================
  // Tratamientos
  // ================================

  obtenerTratamientos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tratamientos`);
  }

  crearTratamiento(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tratamientos`, data);
  }

  actualizarTratamiento(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/tratamientos/${id}`, data);
  }

  eliminarTratamiento(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tratamientos/${id}`);
  }
}
