import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HorarioService {
  private apiUrl = 'https://backend-psicologia-fckw.onrender.com/api/horario'; // ajustá si es necesario

  constructor(private http: HttpClient) {}

  obtenerHorario() {
    return this.http.get(`${this.apiUrl}/obtener`);
  }

  guardarHorario(horarioData: any) {
    return this.http.post(`${this.apiUrl}/guardar`, horarioData);
  }

  editarDia(dia: string, horas: string[]) {
    return this.http.patch(`${this.apiUrl}/editar-dia/${dia}`, { horas });
  }

  editarExcepcion(fecha: string, horas: string[]) {
    return this.http.patch(`${this.apiUrl}/editar-excepcion/${fecha}`, { horas });
  }

   eliminarExcepcion(fecha: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar-excepcion/${fecha}`);
  }
}
