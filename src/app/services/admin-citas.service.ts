import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface CitaDetalle {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion: number;
  estado: string;
  notas?: string;
  precio_nacional?: number;
  precio_internacional?: number;
  created_at?: string;
  paciente: {
    rut: string;
    nombre: string;
    email: string;
    telefono?: string;
    direccion?: string;
    comuna?: string;
    notas_medicas?: string;
  };
  paquete?: {
    id: number;
    nombre: string;
    sesiones: number;
    duracion: number;
  };
}

export interface CrearCitaRequest {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  rut_paciente: string;
  nombre_paciente: string;
  email_paciente: string;
  telefono_paciente?: string;
  paquete_id?: number;
  notas?: string;
}

export interface ReagendarCitaRequest {
  nueva_fecha: string;
  nueva_hora_inicio: string;
  nueva_hora_fin: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminCitasService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Obtener detalle completo de una cita (incluye datos del paciente)
   */
  obtenerDetalleCita(citaId: number): Observable<CitaDetalle> {
    return this.http.get<CitaDetalle>(
      `${this.apiUrl}/api/admin/citas/${citaId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Crear cita manualmente (admin)
   */
  crearCitaManual(datos: CrearCitaRequest): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/api/admin/citas`,
      datos,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Reagendar una cita existente
   */
  reagendarCita(citaId: number, datos: ReagendarCitaRequest): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/api/admin/citas/${citaId}/reagendar`,
      datos,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Cancelar/eliminar una cita
   */
  cancelarCita(citaId: number, motivo?: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/api/admin/citas/${citaId}`,
      { 
        headers: this.getHeaders(),
        body: { motivo }
      }
    );
  }

  /**
   * Actualizar estado de una cita
   */
  actualizarEstadoCita(citaId: number, nuevoEstado: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/api/admin/citas/${citaId}/estado`,
      { estado: nuevoEstado },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Actualizar notas de una cita
   */
  actualizarNotasCita(citaId: number, notas: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/api/admin/citas/${citaId}/notas`,
      { notas },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Buscar o crear paciente
   */
  buscarPaciente(rut: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/api/admin/pacientes/buscar/${rut}`,
      { headers: this.getHeaders() }
    );
  }
}
