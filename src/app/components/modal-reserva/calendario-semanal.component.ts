import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { PaquetesService } from '../../services/paquetes.service';
import { HorarioSlot } from '../../interfaces/paquetes.interface';

interface DiaCalendario {
  fecha: Date;
  fechaStr: string;
  nombre: string;
  numero: number;
  esHoy: boolean;
  esPasado: boolean;
  tieneDisponibilidad: boolean;
  horarios: HorarioSlot[];
  cargando: boolean;
}

@Component({
  selector: 'app-calendario-semanal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="calendario-semanal">
      
      <!-- Header con navegación -->
      <div class="calendario-header">
        <button 
          class="btn-nav" 
          (click)="cambiarSemana(-1)"
          [disabled]="!puedeSemanaAnterior()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        
        <div class="semana-info">
          <h3>{{ getSemanaTexto() }}</h3>
          <p class="semana-subtitulo">{{ getMesAnio() }}</p>
        </div>
        
        <button 
          class="btn-nav" 
          (click)="cambiarSemana(1)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <!-- Grid de días -->
      <div class="dias-grid">
        <div 
          *ngFor="let dia of diasSemana"
          class="dia-card"
          [class.hoy]="dia.esHoy"
          [class.pasado]="dia.esPasado"
          [class.sin-disponibilidad]="!dia.tieneDisponibilidad"
          [class.seleccionado]="diaSeleccionado?.fechaStr === dia.fechaStr"
          (click)="seleccionarDia(dia)"
        >
          <div class="dia-header">
            <span class="dia-nombre">{{ dia.nombre }}</span>
            <span class="dia-numero" [class.hoy-numero]="dia.esHoy">{{ dia.numero }}</span>
          </div>
          
          <div class="dia-body">
            <!-- Loading state -->
            <div *ngIf="dia.cargando" class="loading-slots">
              <div class="spinner-small"></div>
            </div>

            <!-- Sin disponibilidad -->
            <div *ngIf="!dia.cargando && !dia.tieneDisponibilidad" class="no-disponible">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span>No disponible</span>
            </div>

            <!-- Con disponibilidad -->
            <div *ngIf="!dia.cargando && dia.tieneDisponibilidad" class="disponible-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ dia.horarios.length }} horarios</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel de horarios del día seleccionado -->
      <div #horariosPanel class="horarios-panel" *ngIf="diaSeleccionado && diaSeleccionado.tieneDisponibilidad" @slideDown>
        <div class="panel-header">
          <div>
            <h4>Selecciona un horario</h4>
            <p class="panel-subtitle">{{ diaSeleccionado.nombre }} {{ diaSeleccionado.numero }} · {{ diaSeleccionado.horarios.length }} horarios disponibles</p>
          </div>
          <button class="btn-cerrar-panel" (click)="cerrarPanel()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="horarios-grid-modern">
          <button
            *ngFor="let slot of diaSeleccionado.horarios"
            class="btn-horario-modern"
            [class.seleccionado]="horarioSeleccionado?.inicio === slot.inicio && horarioSeleccionado?.fin === slot.fin"
            [disabled]="!slot.disponible"
            (click)="seleccionarHorario(slot)"
            @scaleIn
          >
            <div class="horario-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="horario-info">
              <div class="horario-tiempo">{{ slot.inicio }}</div>
              <div class="horario-rango">{{ slot.inicio }} - {{ slot.fin }}</div>
              <div class="horario-duracion">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ calcularDuracion(slot.inicio, slot.fin) }} min
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Estado vacío -->
      <div class="empty-state" *ngIf="!diaSeleccionado">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <p>Selecciona un día para ver los horarios disponibles</p>
      </div>

    </div>
  `,
  styles: [`
    .calendario-semanal {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Header */
    .calendario-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      gap: 1rem;
    }

    .btn-nav {
      width: 40px;
      height: 40px;
      border: none;
      background: #f3f4f6;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-nav:hover:not(:disabled) {
      background: #e5e7eb;
      transform: scale(1.05);
    }

    .btn-nav:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .btn-nav svg {
      width: 20px;
      height: 20px;
      color: #6b7280;
    }

    .semana-info {
      text-align: center;
      flex: 1;
    }

    .semana-info h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }

    .semana-subtitulo {
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    /* Grid de días */
    .dias-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .dia-card {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      min-height: 120px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    .dia-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: #e5e7eb;
      transition: all 0.3s;
    }

    .dia-card:hover:not(.pasado):not(.sin-disponibilidad) {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
      transform: translateY(-2px);
    }

    .dia-card.hoy::before {
      background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
      height: 4px;
    }

    .dia-card.hoy {
      border-color: #3b82f6;
      background: linear-gradient(to bottom, #eff6ff 0%, white 50%);
    }

    .dia-card.sin-disponibilidad:not(.pasado)::before {
      background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
    }

    .dia-card.sin-disponibilidad:not(.pasado) {
      background: linear-gradient(to bottom, #fef2f2 0%, white 50%);
      border-color: #fca5a5;
      opacity: 0.85;
      cursor: not-allowed;
    }

    .dia-card:not(.sin-disponibilidad):not(.pasado):not(.hoy):not(.seleccionado)::before {
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
    }

    .dia-card:not(.sin-disponibilidad):not(.pasado):not(.hoy):not(.seleccionado) {
      background: linear-gradient(to bottom, #f0fdf4 0%, white 50%);
      border-color: #86efac;
    }

    .dia-card.seleccionado::before {
      background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
      height: 5px;
    }

    .dia-card.seleccionado {
      border-color: #667eea;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .dia-card.pasado {
      background: #f9fafb;
      border-color: #e5e7eb;
      opacity: 0.5;
      cursor: not-allowed;
    }

    .dia-card.pasado::before {
      background: #d1d5db;
    }

    .dia-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .dia-card.seleccionado .dia-header {
      border-bottom-color: rgba(255, 255, 255, 0.3);
    }

    .dia-nombre {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .dia-numero {
      font-size: 1.5rem;
      font-weight: 700;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }

    .dia-numero.hoy-numero {
      background: #667eea;
      color: white;
    }

    .dia-card.seleccionado .dia-numero.hoy-numero {
      background: rgba(255, 255, 255, 0.2);
    }

    .dia-body {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading-slots {
      width: 100%;
      text-align: center;
    }

    .spinner-small {
      width: 24px;
      height: 24px;
      border: 3px solid #e5e7eb;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .no-disponible,
    .disponible-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      text-align: center;
    }

    .no-disponible svg,
    .disponible-info svg {
      width: 28px;
      height: 28px;
      opacity: 0.6;
    }

    .dia-card.seleccionado .no-disponible svg,
    .dia-card.seleccionado .disponible-info svg {
      opacity: 0.9;
    }

    .no-disponible span,
    .disponible-info span {
      font-size: 0.75rem;
      font-weight: 500;
    }

    /* Panel de horarios */
    .horarios-panel {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 16px;
      padding: 2rem;
      margin-top: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #f3f4f6;
    }

    .panel-header h4 {
      margin: 0 0 0.25rem 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
    }

    .panel-subtitle {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
    }

    .btn-cerrar-panel {
      width: 36px;
      height: 36px;
      border: none;
      background: #f3f4f6;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .btn-cerrar-panel:hover {
      background: #e5e7eb;
      transform: rotate(90deg);
    }

    .btn-cerrar-panel svg {
      width: 18px;
      height: 18px;
      color: #6b7280;
    }

    .horarios-grid-modern {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
    }

    .btn-horario-modern {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      min-height: 90px;
    }

    .btn-horario-modern:hover:not(:disabled) {
      border-color: #667eea;
      background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }

    .btn-horario-modern.seleccionado {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-color: #667eea;
      color: white;
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      transform: translateY(-2px);
    }

    .btn-horario-modern:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .horario-icon {
      width: 40px;
      height: 40px;
      background: #f3f4f6;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 0.25rem;
    }

    .btn-horario-modern.seleccionado .horario-icon {
      background: rgba(255, 255, 255, 0.2);
    }

    .horario-icon svg {
      width: 22px;
      height: 22px;
      color: #667eea;
    }

    .btn-horario-modern.seleccionado .horario-icon svg {
      color: white;
    }

    .horario-info {
      flex: 1;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .horario-tiempo {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.125rem;
      color: #111827;
      line-height: 1.2;
    }

    .btn-horario-modern.seleccionado .horario-tiempo {
      color: white;
    }

    .horario-rango {
      font-size: 0.8rem;
      color: #6b7280;
      font-weight: 500;
      line-height: 1.2;
    }

    .btn-horario-modern.seleccionado .horario-rango {
      color: rgba(255, 255, 255, 0.9);
    }

    .horario-duracion {
      font-size: 0.75rem;
      color: #9ca3af;
      font-weight: 600;
      margin-top: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: #f3f4f6;
      border-radius: 6px;
      width: fit-content;
    }

    .horario-duracion svg {
      width: 12px;
      height: 12px;
    }

    .btn-horario-modern.seleccionado .horario-duracion {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #9ca3af;
    }

    .empty-state svg {
      width: 64px;
      height: 64px;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .calendario-semanal {
        padding: 1rem;
      }

      .dias-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }

      .dia-card {
        min-height: 100px;
        padding: 0.75rem;
      }

      .horarios-grid-modern {
        grid-template-columns: 1fr;
      }

      .btn-horario-modern {
        min-height: 80px;
        padding: 1rem;
      }

      .horario-tiempo {
        font-size: 1.1rem;
      }

      .horario-rango {
        font-size: 0.75rem;
      }
    }
  `],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class CalendarioSemanalComponent implements OnInit {
  @Input() paqueteId!: string;
  @Output() seleccion = new EventEmitter<{ fecha: string, horario: HorarioSlot }>();
  @ViewChild('horariosPanel') horariosPanel!: ElementRef;

  semanaActual: Date = new Date();
  diasSemana: DiaCalendario[] = [];
  diaSeleccionado: DiaCalendario | null = null;
  horarioSeleccionado: HorarioSlot | null = null;

  // Caché de horarios consultados
  private cacheHorarios = new Map<string, HorarioSlot[]>();

  constructor(private paquetesService: PaquetesService) {}

  ngOnInit() {
    // Asegurar que la semana actual comience desde hoy si estamos en la semana actual
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    this.semanaActual = hoy;
    this.generarSemana();
    this.cargarDisponibilidadSemana();
  }

  generarSemana() {
    const inicio = this.obtenerLunesDeLaSemana(this.semanaActual);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    this.diasSemana = [];

    const nombresCortos = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicio);
      fecha.setDate(fecha.getDate() + i);
      fecha.setHours(0, 0, 0, 0);
      const fechaStr = this.formatearFecha(fecha);
      
      const esPasado = fecha < hoy;
      
      this.diasSemana.push({
        fecha: fecha,
        fechaStr: fechaStr,
        nombre: nombresCortos[i],
        numero: fecha.getDate(),
        esHoy: fecha.getTime() === hoy.getTime(),
        esPasado: esPasado,
        tieneDisponibilidad: false,
        horarios: [],
        cargando: !esPasado // Solo marcar como cargando si NO es pasado
      });
    }
  }

  async cargarDisponibilidadSemana() {
    const promesas = this.diasSemana
      .filter(dia => !dia.esPasado)
      .map(dia => this.cargarHorariosDia(dia));
    
    await Promise.all(promesas);
  }

  async cargarHorariosDia(dia: DiaCalendario) {
    // Verificar caché primero
    if (this.cacheHorarios.has(dia.fechaStr)) {
      dia.horarios = this.cacheHorarios.get(dia.fechaStr)!;
      dia.tieneDisponibilidad = dia.horarios.length > 0;
      dia.cargando = false;
      return;
    }

    try {
      const data = await this.paquetesService.getDisponibilidadDia(dia.fechaStr, this.paqueteId).toPromise();
      dia.horarios = data?.horarios || [];
      dia.tieneDisponibilidad = dia.horarios.length > 0;
      
      // Guardar en caché
      this.cacheHorarios.set(dia.fechaStr, dia.horarios);
    } catch (error) {
      console.error(`Error al cargar horarios para ${dia.fechaStr}:`, error);
      dia.horarios = [];
      dia.tieneDisponibilidad = false;
    } finally {
      dia.cargando = false;
    }
  }

  seleccionarDia(dia: DiaCalendario) {
    if (dia.esPasado || !dia.tieneDisponibilidad || dia.cargando) {
      return;
    }

    this.diaSeleccionado = dia;
    this.horarioSeleccionado = null;
    
    // Scroll automático al panel de horarios después de que se renderice
    setTimeout(() => {
      if (this.horariosPanel) {
        this.horariosPanel.nativeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  }

  seleccionarHorario(horario: HorarioSlot) {
    if (!horario.disponible) return;
    
    this.horarioSeleccionado = horario;
    
    // Emitir selección completa
    if (this.diaSeleccionado) {
      this.seleccion.emit({
        fecha: this.diaSeleccionado.fechaStr,
        horario: horario
      });
    }
  }

  cerrarPanel() {
    this.diaSeleccionado = null;
    this.horarioSeleccionado = null;
  }

  cambiarSemana(direccion: number) {
    this.semanaActual = new Date(this.semanaActual);
    this.semanaActual.setDate(this.semanaActual.getDate() + (direccion * 7));
    
    this.cerrarPanel();
    this.generarSemana();
    this.cargarDisponibilidadSemana();
  }

  puedeSemanaAnterior(): boolean {
    const inicio = this.obtenerLunesDeLaSemana(this.semanaActual);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return inicio >= hoy;
  }

  obtenerLunesDeLaSemana(fecha: Date): Date {
    const dia = new Date(fecha);
    const diaSemana = dia.getDay();
    const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
    dia.setDate(dia.getDate() + diff);
    dia.setHours(0, 0, 0, 0);
    return dia;
  }

  formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const day = fecha.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getSemanaTexto(): string {
    const inicio = this.diasSemana[0];
    const fin = this.diasSemana[6];
    return `${inicio.numero} - ${fin.numero}`;
  }

  getMesAnio(): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const inicio = this.diasSemana[0].fecha;
    return `${meses[inicio.getMonth()]} ${inicio.getFullYear()}`;
  }

  calcularDuracion(inicio: string, fin: string): number {
    const [hi, mi] = inicio.split(':').map(Number);
    const [hf, mf] = fin.split(':').map(Number);
    return (hf * 60 + mf) - (hi * 60 + mi);
  }
}
