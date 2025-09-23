import { Component, OnInit } from '@angular/core';
import { HorarioService } from '../../services/horario.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

interface RangoHora {
  inicio: string;
  fin: string;
}

@Component({
  selector: 'app-horario',
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
  templateUrl: './horario.component.html',
  styleUrl: './horario.component.css'
})
export class HorarioComponent implements OnInit{

  horarioSemanal: Record<string, RangoHora[]> = {};
  excepciones: Record<string, RangoHora[]> = {};
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

  // Agregar rango de hora a un día
  agregarRangoDia(dia: string, inicio: string, fin: string) {
    if (!inicio || !fin) {
      alert('Debe especificar hora de inicio y fin');
      return;
    }

    if (inicio >= fin) {
      alert('La hora de inicio debe ser menor que la hora de fin');
      return;
    }

    const nuevoRango: RangoHora = { inicio, fin };
    const rangosActuales = this.horarioSemanal[dia] || [];
    
    // Verificar si ya existe un rango similar
    const existeRango = rangosActuales.some(r => r.inicio === inicio && r.fin === fin);
    if (existeRango) {
      alert('Ya existe un rango con esos horarios');
      return;
    }

    const nuevosRangos = [...rangosActuales, nuevoRango];
    this.actualizarDia(dia, nuevosRangos);
  }

  // Eliminar rango de un día
  eliminarRangoDia(dia: string, index: number) {
    const rangosActuales = this.horarioSemanal[dia] || [];
    const nuevosRangos = rangosActuales.filter((_, i) => i !== index);
    this.actualizarDia(dia, nuevosRangos);
  }

  // Actualizar día con array de rangos
  actualizarDia(dia: string, rangos: RangoHora[]) {
    this.horarioService.editarDia(dia, rangos).subscribe({
      next: () => {
        alert(`Horario del ${dia} actualizado`);
        this.horarioSemanal[dia] = rangos;
      },
      error: (err) => console.error(err)
    });
  }

  // Agregar rango a excepción
  agregarRangoExcepcion(fecha: string, inicio: string, fin: string) {
    if (!inicio || !fin) {
      alert('Debe especificar hora de inicio y fin');
      return;
    }

    if (inicio >= fin) {
      alert('La hora de inicio debe ser menor que la hora de fin');
      return;
    }

    const nuevoRango: RangoHora = { inicio, fin };
    const rangosActuales = this.excepciones[fecha] || [];
    
    const existeRango = rangosActuales.some(r => r.inicio === inicio && r.fin === fin);
    if (existeRango) {
      alert('Ya existe un rango con esos horarios');
      return;
    }

    const nuevosRangos = [...rangosActuales, nuevoRango];
    this.actualizarExcepcion(fecha, nuevosRangos);
  }

  // Eliminar rango de excepción
  eliminarRangoExcepcion(fecha: string, index: number) {
    const rangosActuales = this.excepciones[fecha] || [];
    const nuevosRangos = rangosActuales.filter((_, i) => i !== index);
    this.actualizarExcepcion(fecha, nuevosRangos);
  }

  // Actualizar excepción
  actualizarExcepcion(fecha: string, rangos: RangoHora[]) {
    this.horarioService.editarExcepcion(fecha, rangos).subscribe({
      next: () => {
        alert(`Excepción del ${fecha} actualizada`);
        this.excepciones[fecha] = rangos;
      },
      error: (err) => console.error(err)
    });
  }

  // Agregar nueva excepción
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

  // Eliminar excepción completa
  eliminarExcepcion(fecha: string) {
    this.horarioService.eliminarExcepcion(fecha).subscribe({
      next: () => {
        alert(`Excepción del ${fecha} eliminada.`);
        delete this.excepciones[fecha];
      },
      error: err => console.error('Error al eliminar excepción:', err)
    });
  }
}

