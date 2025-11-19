import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HorarioService {
  private apiUrl = `${environment.apiUrl}/api/horarios`; 

  constructor(private http: HttpClient) {}

  obtenerHorario() {
    return this.http.get(`${this.apiUrl}/semanal`);
  }

  guardarHorario(horarioData: any) {
    return this.http.post(`${this.apiUrl}/semanal`, horarioData);
  }

  editarDia(dia: string, rangos: any[]) {
    return this.http.patch(`${this.apiUrl}/editar-dia/${dia}`, { horas: rangos });
  }

  editarExcepcion(fecha: string, rangos: any[]) {
    return this.http.patch(`${this.apiUrl}/editar-excepcion/${fecha}`, { horas: rangos });
  }

   eliminarExcepcion(fecha: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar-excepcion/${fecha}`);
  }
}
