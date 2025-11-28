import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface BloqueoManual {
  id?: number;
  fecha: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM:SS o HH:MM
  hora_fin: string; // HH:MM:SS o HH:MM
  tipo: string;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BloquesManualesService {
  private apiUrl = `${environment.apiUrl}/api/bloques-manuales`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });
  }

  obtenerBloques(fechaInicio?: string, fechaFin?: string): Observable<BloqueoManual[]> {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(); // Más aleatoriedad
    let params: any = { 
      t: timestamp,
      r: random
    };
    
    if (fechaInicio && fechaFin) {
      params.fecha_inicio = fechaInicio;
      params.fecha_fin = fechaFin;
    }

    console.log('[SERVICE-GET-BLOQUES] Obteniendo con params:', params);

    return this.http.get<BloqueoManual[]>(this.apiUrl, {
      headers: this.getHeaders(),
      params
    }).pipe(
      tap((bloques: BloqueoManual[]) => console.log('[SERVICE-GET-BLOQUES] Bloques recibidos:', bloques.length))
    );
  }

  crearBloqueo(bloqueo: Omit<BloqueoManual, 'id'>): Observable<BloqueoManual> {
    console.log('[SERVICE] Creando bloqueo:', bloqueo);
    return this.http.post<BloqueoManual>(this.apiUrl, bloqueo, {
      headers: this.getHeaders()
    });
  }

  actualizarBloqueo(id: number, bloqueo: Omit<BloqueoManual, 'id'>): Observable<BloqueoManual> {
    console.log('[SERVICE] Actualizando bloqueo:', { id, bloqueo });
    return this.http.put<BloqueoManual>(`${this.apiUrl}/${id}`, bloqueo, {
      headers: this.getHeaders()
    });
  }

  eliminarBloqueo(id: number | string): Observable<void> {
    console.log('[SERVICE-ELIMINAR] Eliminando bloqueo con ID:', id, 'tipo:', typeof id);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Convierte un objeto Date a string YYYY-MM-DD sin problemas de timezone
   * Usa UTC para evitar que la zona horaria cause desfases de días
   */
  formatearFechaLocal(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const day = fecha.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Normaliza formato de hora quitando segundos
   * "09:00:00" -> "09:00"
   */
  normalizarHora(hora: string): string {
    if (!hora) return '00:00';
    const partes = hora.split(':');
    return `${partes[0]}:${partes[1]}`;
  }
}
