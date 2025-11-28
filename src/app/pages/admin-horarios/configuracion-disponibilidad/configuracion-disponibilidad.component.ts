import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ConfiguracionGlobal {
  minimo_anticipacion_horas: number;
  maximo_dias_adelante: number;
  permitir_citas_domingos: boolean;
  permitir_citas_fines_semana: boolean;
}

@Component({
  selector: 'app-configuracion-disponibilidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion-disponibilidad.component.html',
  styleUrls: ['./configuracion-disponibilidad.component.css']
})
export class ConfiguracionDisponibilidadComponent implements OnInit, OnChanges {
  @Input() horarioSemanal: any = {};
  @Output() horarioChange = new EventEmitter<any>();

  configGlobal: ConfiguracionGlobal = {
    minimo_anticipacion_horas: 24,
    maximo_dias_adelante: 30,
    permitir_citas_domingos: false,
    permitir_citas_fines_semana: true
  };

  diaOrigen = '';
  diaDestino = '';

  diasSemana = [
    { key: 'lunes', nombre: 'Lunes', activo: true },
    { key: 'martes', nombre: 'Martes', activo: true },
    { key: 'miercoles', nombre: 'Miércoles', activo: true },
    { key: 'jueves', nombre: 'Jueves', activo: true },
    { key: 'viernes', nombre: 'Viernes', activo: true },
    { key: 'sabado', nombre: 'Sábado', activo: false },
    { key: 'domingo', nombre: 'Domingo', activo: false }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarConfiguracion();
    // Esperar un momento para que el Input horarioSemanal esté disponible
    setTimeout(() => {
      this.inicializarDiasActivos();
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['horarioSemanal'] && !changes['horarioSemanal'].firstChange) {
      console.log('[DEBUG] horarioSemanal cambió desde el padre:', this.horarioSemanal);
      this.inicializarDiasActivos();
    }
  }

  cargarConfiguracion() {
    this.http.get<ConfiguracionGlobal>(`${environment.apiUrl}/api/configuracion/disponibilidad`).subscribe({
      next: (config) => {
        this.configGlobal = { ...this.configGlobal, ...config };
      },
      error: (err) => {
        console.error('Error al cargar configuración:', err);
      }
    });
  }

  guardarConfiguracion() {
    this.http.post(`${environment.apiUrl}/api/configuracion/disponibilidad`, this.configGlobal).subscribe({
      next: () => {
        alert('Configuración guardada exitosamente');
      },
      error: (err) => {
        console.error('Error al guardar configuración:', err);
        alert('Error al guardar configuración');
      }
    });
  }

  inicializarDiasActivos() {
    console.log('[DEBUG] Inicializando días activos con horarioSemanal:', this.horarioSemanal);
    
    // Normalizar formato de horarios de hora_inicio/hora_fin a inicio/fin
    Object.keys(this.horarioSemanal).forEach(key => {
      if (Array.isArray(this.horarioSemanal[key])) {
        this.horarioSemanal[key] = this.horarioSemanal[key].map((bloque: any) => ({
          inicio: bloque.inicio || bloque.hora_inicio || '09:00',
          fin: bloque.fin || bloque.hora_fin || '17:00',
          modalidad: bloque.modalidad || 'ambas'
        }));
      }
    });
    
    this.diasSemana.forEach(dia => {
      dia.activo = this.horarioSemanal[dia.key] && this.horarioSemanal[dia.key].length > 0;
    });
    
    console.log('[DEBUG] Días activos después de inicializar:', this.diasSemana.filter(d => d.activo).map(d => d.nombre));
  }

  toggleDia(dia: any) {
    if (dia.activo) {
      // Activar día - agregar bloque por defecto
      if (!this.horarioSemanal[dia.key]) {
        this.horarioSemanal[dia.key] = [{ inicio: '09:00', fin: '17:00', modalidad: 'ambas' }];
      }
    } else {
      // Desactivar día - limpiar bloques
      delete this.horarioSemanal[dia.key];
    }
    this.onHorarioChange();
  }

  agregarBloque(diaKey: string) {
    if (!this.horarioSemanal[diaKey]) {
      this.horarioSemanal[diaKey] = [];
    }
    this.horarioSemanal[diaKey].push({ inicio: '09:00', fin: '17:00', modalidad: 'ambas' });
    this.onHorarioChange();
  }

  eliminarBloque(diaKey: string, index: number) {
    this.horarioSemanal[diaKey].splice(index, 1);
    if (this.horarioSemanal[diaKey].length === 0) {
      delete this.horarioSemanal[diaKey];
      const dia = this.diasSemana.find(d => d.key === diaKey);
      if (dia) dia.activo = false;
    }
    this.onHorarioChange();
  }

  aplicarATodos() {
    if (!this.diaOrigen || !this.horarioSemanal[this.diaOrigen]) {
      console.log('[DEBUG] No se puede aplicar - No hay horario origen');
      return;
    }

    console.log('[DEBUG] Aplicando a todos los días desde:', this.diaOrigen);
    
    const horarioBase = JSON.parse(JSON.stringify(this.horarioSemanal[this.diaOrigen]));
    
    this.diasSemana.forEach(dia => {
      if (dia.key !== this.diaOrigen) {
        this.horarioSemanal[dia.key] = JSON.parse(JSON.stringify(horarioBase));
        dia.activo = true;
      }
    });

    // Forzar detección de cambios
    this.horarioSemanal = { ...this.horarioSemanal };
    this.inicializarDiasActivos();
    this.onHorarioChange();
    
    console.log('[DEBUG] Aplicado a todos los días');
  }

  aplicarALaborables() {
    if (!this.diaOrigen || !this.horarioSemanal[this.diaOrigen]) {
      console.log('[DEBUG] No se puede aplicar - No hay horario origen');
      return;
    }

    console.log('[DEBUG] Aplicando a días laborables desde:', this.diaOrigen);
    
    const horarioBase = JSON.parse(JSON.stringify(this.horarioSemanal[this.diaOrigen]));
    const diasLaborables = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
    
    diasLaborables.forEach(diaKey => {
      if (diaKey !== this.diaOrigen) {
        this.horarioSemanal[diaKey] = JSON.parse(JSON.stringify(horarioBase));
        const dia = this.diasSemana.find(d => d.key === diaKey);
        if (dia) dia.activo = true;
      }
    });

    // Forzar detección de cambios
    this.horarioSemanal = { ...this.horarioSemanal };
    this.inicializarDiasActivos();
    this.onHorarioChange();
    
    console.log('[DEBUG] Aplicado a días laborables');
  }

  copiarHorario() {
    console.log('[DEBUG] Copiar horario:', { origen: this.diaOrigen, destino: this.diaDestino });
    console.log('[DEBUG] Horarios disponibles:', Object.keys(this.horarioSemanal));
    console.log('[DEBUG] Horario origen existe:', !!this.horarioSemanal[this.diaOrigen]);
    
    if (this.diaOrigen && this.diaDestino && this.horarioSemanal[this.diaOrigen]) {
      // Hacer copia profunda de los horarios
      this.horarioSemanal[this.diaDestino] = JSON.parse(JSON.stringify(this.horarioSemanal[this.diaOrigen]));
      
      // Forzar la detección de cambios en el objeto
      this.horarioSemanal = { ...this.horarioSemanal };
      
      // Actualizar el estado activo del día destino
      const dia = this.diasSemana.find(d => d.key === this.diaDestino);
      if (dia) {
        dia.activo = true;
        console.log('[DEBUG] Día destino activado:', this.diaDestino);
      }
      
      // Re-inicializar para asegurar consistencia
      this.inicializarDiasActivos();
      
      // Emitir el cambio al componente padre
      this.onHorarioChange();
      
      console.log('[DEBUG] Copia completada. Nuevo horarioSemanal:', this.horarioSemanal);
      
      // Resetear selecciones
      this.diaOrigen = '';
      this.diaDestino = '';
    } else {
      console.log('[DEBUG] No se pudo copiar - Validación falló');
      if (!this.diaOrigen) console.log('[DEBUG] - No hay día origen');
      if (!this.diaDestino) console.log('[DEBUG] - No hay día destino');
      if (!this.horarioSemanal[this.diaOrigen]) console.log('[DEBUG] - No existen horarios para día origen');
    }
  }

  onHorarioChange() {
    this.horarioChange.emit(this.horarioSemanal);
  }
}