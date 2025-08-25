import { Component, OnInit } from '@angular/core';
import { HorarioService } from '../../services/horario.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-horario',
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
  templateUrl: './horario.component.html',
  styleUrl: './horario.component.css'
})
export class HorarioComponent implements OnInit{

  horarioSemanal: any = {};
  excepciones: Record<string, string[]> = {};
   nuevaFechaExcepcion: string = '';

  constructor(private horarioService: HorarioService) {}

  ngOnInit(): void {
    this.horarioService.obtenerHorario().subscribe({
      next: (data: any) => {
        this.horarioSemanal = data.horarioSemanal || {};
        this.excepciones = data.excepciones || {};
        console.log('Horario recibido:', data);
      },
      error: (err) => {
        console.error('Error al obtener horario', err);
      }
    });
  }

  actualizarDia(dia: string, horas: string[]) {
    this.horarioService.editarDia(dia, horas).subscribe({
      next: () => alert(`Horario del ${dia} actualizado`),
      error: (err) => console.error(err)
    });
  }

  actualizarExcepcion(fecha: string, horas: string[]) {
    this.horarioService.editarExcepcion(fecha, horas).subscribe({
      next: () => alert(`Excepción del ${fecha} actualizada`),
      error: (err) => console.error(err)
    });
  }
getHoras(horas: unknown): string {
  if (Array.isArray(horas)) {
    return horas.join(', ');
  }
  return 'Sin horas disponibles';
}

// Para agregar una hora a un día específico
agregarHoraDia(dia: string, horaNueva: string) {
  if (!horaNueva) return;

  // Obtener las horas actuales o inicializar array vacío
  const horasActuales = this.horarioSemanal[dia] || [];

  // Si la hora no existe, agregarla
  if (!horasActuales.includes(horaNueva)) {
    horasActuales.push(horaNueva);
    this.actualizarDia(dia, horasActuales);
  }
}

// Para eliminar una hora de un día
eliminarHoraDia(dia: string, horaEliminar: string) {
  const horasActuales = this.horarioSemanal[dia] || [];
  const index = horasActuales.indexOf(horaEliminar);
  if (index !== -1) {
    horasActuales.splice(index, 1);
    this.actualizarDia(dia, horasActuales);
  }
}
// Agregar hora en una excepción (fecha)
// En el componente TS:

// Agregar hora a una excepción (fecha)
agregarHoraExcepcion(fecha: string, hora: string) {
  if (!hora) return;

  const horasActuales = this.excepciones[fecha] || [];
  if (!horasActuales.includes(hora)) {
    const nuevasHoras = [...horasActuales, hora];
    this.horarioService.editarExcepcion(fecha, nuevasHoras).subscribe(() => {
      this.excepciones[fecha] = nuevasHoras;
    });
  }
}

// Eliminar hora de una excepción
eliminarHoraExcepcion(fecha: string, hora: string) {
  const horasActuales = this.excepciones[fecha] || [];
  const nuevasHoras = horasActuales.filter(h => h !== hora);
  this.horarioService.editarExcepcion(fecha, nuevasHoras).subscribe(() => {
    this.excepciones[fecha] = nuevasHoras;
  });
}

// Agregar una nueva excepción (día sin horas o con horas)
agregarExcepcionNueva(fecha: string) {
  if (!fecha) return;
  if (!this.excepciones[fecha]) {
    this.horarioService.editarExcepcion(fecha, []).subscribe(() => {
      this.excepciones[fecha] = [];
    });
  } else {
    alert('Ya existe una excepción para esa fecha.');
  }
}
eliminarExcepcion(fecha: string) {
  this.horarioService.eliminarExcepcion(fecha).subscribe({
    next: () => {
      alert(`Excepción del ${fecha} eliminada.`);
      // También actualizamos el objeto para que desaparezca del listado en el frontend:
      delete this.excepciones[fecha];
    },
    error: err => console.error('Error al eliminar excepción:', err)
  });
}





}

