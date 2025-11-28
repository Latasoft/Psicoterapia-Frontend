import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Cita {
  id: number;
  fecha: string;
  hora: string;
  hora_fin: string;
  nombre_paciente: string;
  email_paciente: string;
  estado: 'confirmada' | 'pendiente' | 'cancelada' | 'completada';
  modalidad: 'presencial' | 'online' | 'ambas';
  notas?: string;
}

interface BloqueManual {
  id?: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  tipo: 'bloqueo' | 'disponible';
  descripcion: string;
}

interface HorarioDisponible {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  modalidad: string;
}

@Component({
  selector: 'app-calendario-gestion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendario-gestion.component.html',
  styleUrls: ['./calendario-gestion.component.css']
})
export class CalendarioGestionComponent implements OnInit, AfterViewInit, OnDestroy {
  diasSemana: string[] = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  semanasMes: any[][] = [];
  @Input() excepciones: any[] = [];
  @Output() excepcionChange = new EventEmitter<any[]>();

  citas: Cita[] = [];
  bloquesManuales: BloqueManual[] = [];
  horariosDisponibles: HorarioDisponible[] = [];
  diaSeleccionado: string = '';
  mostrarModal = false;
  mostrarModalExcepcion = false;
  tipoModal: 'bloqueo' | 'disponibilidad' = 'bloqueo';
  vistaActual = 'month';
  fechaActual = new Date();
  tituloMes = '';
  diasVisibles: any[] = [];
  horasDia = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  bloqueForm: BloqueManual = {
    fecha: '',
    hora_inicio: '09:00',
    hora_fin: '17:00',
    tipo: 'bloqueo',
    descripcion: ''
  };

  excepcionForm = {
    fecha: '',
    tipo: 'descanso',
    hora_inicio: '13:00',
    hora_fin: '14:00',
    descripcion: 'Descanso'
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.actualizarVista();
    this.cargarHorariosDisponibles();
    this.cargarCitas();
    this.cargarBloquesManuales();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {}

  actualizarVista() {
    const year = this.fechaActual.getFullYear();
    const month = this.fechaActual.getMonth();
    this.tituloMes = this.fechaActual.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });

    // Primer día de la cuadrícula (domingo anterior o igual al 1er día del mes)
    const primerDiaMes = new Date(year, month, 1);
    const primerDiaGrid = new Date(primerDiaMes);
    primerDiaGrid.setDate(primerDiaMes.getDate() - primerDiaMes.getDay());

    // Último día de la cuadrícula (sábado posterior o igual al último día del mes)
    const ultimoDiaMes = new Date(year, month + 1, 0);
    const ultimoDiaGrid = new Date(ultimoDiaMes);
    ultimoDiaGrid.setDate(ultimoDiaMes.getDate() + (6 - ultimoDiaMes.getDay()));

    // Construir semanas
    const semanas: any[][] = [];
    let semana: any[] = [];
    let d = new Date(primerDiaGrid);
    const hoyStr = new Date().toISOString().split('T')[0];
    while (d <= ultimoDiaGrid) {
      const fechaStr = d.toISOString().split('T')[0];
      semana.push({
        dia: d.getDate(),
        fechaCompleta: fechaStr,
        esHoy: fechaStr === hoyStr,
        fueraMes: d.getMonth() !== month
      });
      if (semana.length === 7) {
        semanas.push(semana);
        semana = [];
      }
      d.setDate(d.getDate() + 1);
    }
    this.semanasMes = semanas;
  }

  getCitasEnDia(fecha: string) {
    return this.citas.filter(c => c.fecha === fecha);
  }

  getBloqueosEnDia(fecha: string) {
    return this.bloquesManuales.filter(b => b.fecha === fecha);
  }

  cambiarVista(direccion: 'prev' | 'next') {
    if (direccion === 'prev') {
      this.fechaActual.setMonth(this.fechaActual.getMonth() - 1);
    } else {
      this.fechaActual.setMonth(this.fechaActual.getMonth() + 1);
    }
    this.actualizarVista();
  }

  cambiarVistaTipo() {
    // Implementar cambio de vista si es necesario
    this.actualizarVista();
  }

  cargarHorariosDisponibles() {
    this.http.get<any>(`${environment.apiUrl}/api/admin/horarios`).subscribe({
      next: (res) => {
        const horarios: HorarioDisponible[] = [];
        const diasMap: {[key: string]: number} = {
          'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4, 'viernes': 5, 'sabado': 6, 'domingo': 0
        };
        
        Object.entries(res.horarioSemanal || {}).forEach(([dia, bloques]: any) => {
          bloques.forEach((bloque: any) => {
            horarios.push({
              dia_semana: diasMap[dia],
              hora_inicio: bloque.inicio,
              hora_fin: bloque.fin,
              modalidad: bloque.modalidad
            });
          });
        });
        
        this.horariosDisponibles = horarios;
        console.log('[DEBUG] Horarios disponibles cargados:', this.horariosDisponibles);
      },
      error: (err) => {
        console.error('Error al cargar horarios disponibles:', err);
      }
    });
  }

  tieneDisponibilidad(fecha: string): boolean {
    const fechaObj = new Date(fecha + 'T00:00:00');
    const diaSemana = fechaObj.getDay();
    return this.horariosDisponibles.some(h => h.dia_semana === diaSemana);
  }

  cargarCitas() {
    const fechaInicio = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth(), 1).toISOString().split('T')[0];
    const fechaFin = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth() + 1, 0).toISOString().split('T')[0];

    this.http.get<Cita[]>(`${environment.apiUrl}/api/citas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`).subscribe({
      next: (citas) => {
        this.citas = citas;
      },
      error: (err) => {
        console.error('Error al cargar citas:', err);
      }
    });
  }

  cargarBloquesManuales() {
    const fechaInicio = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth(), 1).toISOString().split('T')[0];
    const fechaFin = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth() + 1, 0).toISOString().split('T')[0];

    this.http.get<BloqueManual[]>(`${environment.apiUrl}/api/bloques-manuales?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`).subscribe({
      next: (bloques) => {
        this.bloquesManuales = bloques;
      },
      error: (err) => {
        console.error('Error al cargar bloques manuales:', err);
      }
    });
  }

  esDisponible(fecha: string, hora: string): boolean {
    // Lógica para determinar si una hora está disponible
    // Basado en horarios semanales, excepciones, citas existentes, etc.
    return !this.tieneCita(fecha, hora) && !this.estaBloqueado(fecha, hora);
  }

  tieneCita(fecha: string, hora: string): boolean {
    return this.citas.some(cita =>
      cita.fecha === fecha &&
      cita.hora <= hora &&
      cita.hora_fin > hora
    );
  }

  estaBloqueado(fecha: string, hora: string): boolean {
    return this.bloquesManuales.some(bloque =>
      bloque.fecha === fecha &&
      bloque.tipo === 'bloqueo' &&
      bloque.hora_inicio <= hora &&
      bloque.hora_fin > hora
    );
  }

  getCitaEnHora(fecha: string, hora: string): Cita | null {
    return this.citas.find(cita =>
      cita.fecha === fecha &&
      cita.hora <= hora &&
      cita.hora_fin > hora
    ) || null;
  }

  getBloqueoEnHora(fecha: string, hora: string): BloqueManual | null {
    return this.bloquesManuales.find(bloque =>
      bloque.fecha === fecha &&
      bloque.hora_inicio <= hora &&
      bloque.hora_fin > hora
    ) || null;
  }

  onCeldaClick(fecha: string, hora?: string) {
    console.log('Click en:', fecha, hora);
    this.diaSeleccionado = fecha;
    this.excepcionForm.fecha = fecha;
    this.mostrarModalExcepcion = true;
  }

  abrirModalBloqueo() {
    this.tipoModal = 'bloqueo';
    this.bloqueForm = {
      fecha: '',
      hora_inicio: '09:00',
      hora_fin: '17:00',
      tipo: 'bloqueo',
      descripcion: ''
    };
    this.mostrarModal = true;
  }

  abrirModalDisponibilidad() {
    this.tipoModal = 'disponibilidad';
    this.bloqueForm = {
      fecha: '',
      hora_inicio: '09:00',
      hora_fin: '17:00',
      tipo: 'disponible',
      descripcion: ''
    };
    this.mostrarModal = true;
  }

  guardarBloqueManual() {
    this.bloqueForm.tipo = this.tipoModal === 'bloqueo' ? 'bloqueo' : 'disponible';

    this.http.post(`${environment.apiUrl}/api/bloques-manuales`, this.bloqueForm).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarBloquesManuales();
      },
      error: (err) => {
        console.error('Error al guardar bloque manual:', err);
      }
    });
  }

  guardarExcepcion() {
    const excepcion = {
      fecha: this.excepcionForm.fecha,
      hora_inicio: this.excepcionForm.hora_inicio,
      hora_fin: this.excepcionForm.hora_fin,
      tipo: 'bloqueo',
      descripcion: this.excepcionForm.descripcion
    };

    this.http.post(`${environment.apiUrl}/api/bloques-manuales`, excepcion).subscribe({
      next: () => {
        this.cerrarModalExcepcion();
        this.cargarBloquesManuales();
      },
      error: (err) => {
        console.error('Error al guardar excepción:', err);
        alert('Error al guardar la excepción');
      }
    });
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  cerrarModalExcepcion() {
    this.mostrarModalExcepcion = false;
  }
}