import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface DiaConfig {
  hora_inicio: string;
  hora_fin: string;
  pausas: { inicio: string; fin: string }[];
  modalidad: string;
}

@Component({
  selector: 'app-horario-semanal-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horario-semanal-list.component.html',
  styleUrls: ['./horario-semanal-list.component.css']
})
export class HorarioSemanalListComponent implements OnInit, OnChanges {
  @Input() horarioSemanal: any;
  @Output() horarioChange = new EventEmitter<any>();

  diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  guardando = false;
  horarioConfig: { [dia: string]: DiaConfig } = {};

  ngOnInit() {
    this.convertirAConfig();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['horarioSemanal']) {
      this.convertirAConfig();
    }
  }

  convertirAConfig() {
    this.horarioConfig = {};
    for (const dia of this.diasSemana) {
      const bloques = this.horarioSemanal[dia] || [];
      if (bloques.length > 0) {
        // Asumir que los bloques están ordenados y consecutivos
        const primerBloque = bloques[0];
        const ultimoBloque = bloques[bloques.length - 1];
        this.horarioConfig[dia] = {
          hora_inicio: primerBloque.inicio,
          hora_fin: ultimoBloque.fin,
          pausas: [], // Por ahora vacío, podríamos inferir de gaps
          modalidad: primerBloque.modalidad
        };
      } else {
        this.horarioConfig[dia] = {
          hora_inicio: '',
          hora_fin: '',
          pausas: [],
          modalidad: 'ambas'
        };
      }
    }
  }

  getDiaConfig(dia: string): DiaConfig {
    return this.horarioConfig[dia] || { hora_inicio: '', hora_fin: '', pausas: [], modalidad: 'ambas' };
  }

  agregarPausa(dia: string) {
    this.horarioConfig[dia].pausas.push({ inicio: '', fin: '' });
  }

  eliminarPausa(dia: string, i: number) {
    this.horarioConfig[dia].pausas.splice(i, 1);
  }

  guardarCambios() {
    this.guardando = true;
    // Convertir horarioConfig a horarioSemanal (generar bloques disponibles)
    const nuevoHorarioSemanal: any = {};
    for (const dia of this.diasSemana) {
      const config = this.horarioConfig[dia];
      if (config.hora_inicio && config.hora_fin) {
        const bloques: any[] = [];
        let currentTime = config.hora_inicio;
        for (const pausa of config.pausas.sort((a, b) => a.inicio.localeCompare(b.inicio))) {
          if (pausa.inicio > currentTime) {
            bloques.push({
              inicio: currentTime,
              fin: pausa.inicio,
              modalidad: config.modalidad
            });
          }
          currentTime = pausa.fin;
        }
        if (currentTime < config.hora_fin) {
          bloques.push({
            inicio: currentTime,
            fin: config.hora_fin,
            modalidad: config.modalidad
          });
        }
        nuevoHorarioSemanal[dia] = bloques;
      } else {
        nuevoHorarioSemanal[dia] = [];
      }
    }
    this.horarioChange.emit(nuevoHorarioSemanal);
    this.guardando = false;
  }
}
