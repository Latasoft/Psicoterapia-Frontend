import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Paquete,
  DisponibilidadDia,
  DisponibilidadMes,
  ReservaRequest,
  ReservaResponse
} from '../interfaces/paquetes.interface';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaquetesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ========================================
  // PAQUETES
  // ========================================

  /**
   * Obtiene todos los paquetes activos
   */
  getPaquetes(): Observable<Paquete[]> {
    return this.http.get<{ paquetes: Paquete[] }>(`${this.apiUrl}/api/paquetes`).pipe(
      map((res: { paquetes: Paquete[] }) => res.paquetes || [])
    );
  }

  /**
   * Obtiene todos los paquetes (activos e inactivos) para administración
   */
  getAllPaquetes(): Observable<Paquete[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ paquetes: Paquete[] }>(`${this.apiUrl}/api/admin/paquetes`, { headers }).pipe(
      map((res: { paquetes: Paquete[] }) => res.paquetes || [])
    );
  }

  /**
   * Obtiene un paquete específico por ID
   */
  getPaqueteById(id: string): Observable<Paquete> {
    return this.http.get<Paquete>(`${this.apiUrl}/api/paquetes/${id}`);
  }

  /**
   * Crea un nuevo paquete (requiere autenticación admin)
   */
  createPaquete(paquete: Omit<Paquete, 'id'>): Observable<Paquete> {
    const headers = this.getAuthHeaders();
    return this.http.post<{ paquete: Paquete }>(`${this.apiUrl}/api/paquetes`, paquete, { headers }).pipe(
      map((res: { paquete: Paquete }) => res.paquete)
    );
  }

  /**
   * Actualiza un paquete existente (requiere autenticación admin)
   */
  updatePaquete(id: string, paquete: Partial<Paquete>): Observable<Paquete> {
    const headers = this.getAuthHeaders();
    return this.http.put<{ paquete: Paquete }>(`${this.apiUrl}/api/paquetes/${id}`, paquete, { headers }).pipe(
      map((res: { paquete: Paquete }) => res.paquete)
    );
  }

  /**
   * Elimina un paquete (requiere autenticación admin)
   */
  deletePaquete(id: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/api/paquetes/${id}`, { headers });
  }

  /**
   * Obtiene los headers de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
  }

  // ========================================
  // DISPONIBILIDAD
  // ========================================

  /**
   * Obtiene la disponibilidad de todo un mes
   * @param year Año (ej: 2025)
   * @param month Mes 1-12
   * @param paqueteId ID del paquete
   */
  getDisponibilidadMes(year: number, month: number, paqueteId: string): Observable<DisponibilidadMes> {
    return this.http.get<DisponibilidadMes>(
      `${this.apiUrl}/api/disponibilidad/mes/${year}/${month}/${paqueteId}`
    );
  }

  /**
   * Obtiene los horarios disponibles de un día específico
   * @param fecha Formato YYYY-MM-DD
   * @param paqueteId ID del paquete
   */
  getDisponibilidadDia(fecha: string, paqueteId: string): Observable<DisponibilidadDia> {
    return this.http.get<DisponibilidadDia>(
      `${this.apiUrl}/api/disponibilidad/dia/${fecha}/${paqueteId}`
    );
  }

  /**
   * Obtiene la siguiente fecha con disponibilidad
   * @param paqueteId ID del paquete
   */
  getSiguienteFechaDisponible(paqueteId: string): Observable<{ fecha: string }> {
    return this.http.get<{ fecha: string }>(
      `${this.apiUrl}/api/disponibilidad/siguiente/${paqueteId}`
    );
  }

  // ========================================
  // RESERVAS
  // ========================================

  /**
   * Crea una nueva reserva con paquete (múltiples sesiones)
   */
  reservarConPaquete(datos: ReservaRequest): Observable<ReservaResponse> {
    return this.http.post<ReservaResponse>(
      `${this.apiUrl}/api/reservas/con-paquete`,
      datos
    );
  }

  // ========================================
  // HELPERS
  // ========================================

  /**
   * Formatea fecha a string legible
   * @param fecha Formato YYYY-MM-DD
   * @returns "Lunes 15 de Enero de 2025"
   */
  formatearFecha(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    return `${dias[date.getDay()]} ${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
  }

  /**
   * Obtiene el precio del paquete según país
   * @param paquete Paquete
   * @param esInternacional true si es internacional
   * @returns precio formateado
   */
  getPrecio(paquete: Paquete, esInternacional: boolean = false): string {
    if (esInternacional) {
      return `USD $${paquete.precio_internacional}`;
    }
    return `$${paquete.precio_nacional.toLocaleString('es-CL')} CLP`;
  }

  /**
   * Obtiene el ícono del modal según la modalidad
   */
  getIconoModalidad(modalidad: string): string {
    switch (modalidad) {
      case 'presencial':
        return '📍';
      case 'online':
        return '💻';
      case 'ambas':
        return '📍 / 💻';
      default:
        return '';
    }
  }
}
