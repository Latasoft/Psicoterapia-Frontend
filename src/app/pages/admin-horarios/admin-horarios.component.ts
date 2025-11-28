import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminHorariosService } from './admin-horarios.service';
import { CatalogoPaquetesComponent } from './catalogo-paquetes/catalogo-paquetes.component';
import { ConfiguracionDisponibilidadComponent } from './configuracion-disponibilidad/configuracion-disponibilidad.component';
// import { CalendarioGestionComponent } from './calendario-gestion/calendario-gestion.component';
import { VistaSemanalCalendarioComponent } from './vista-semanal-calendario/vista-semanal-calendario.component';
import { environment } from '../../environments/environment';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-horarios',
  standalone: true,
  imports: [
    CommonModule,
    CatalogoPaquetesComponent,
    ConfiguracionDisponibilidadComponent,
    // CalendarioGestionComponent, // Comentado - Calendario Mensual oculto
    VistaSemanalCalendarioComponent
  ],
  templateUrl: './admin-horarios.component.html',
  styleUrls: ['./admin-horarios.component.css']
})
export class AdminHorariosComponent implements OnInit {
  horarioSemanal: any = {};
  excepciones: any[] = [];
  cargando = true;
  guardando = false;
  error = '';
  activeTab = 'disponibilidad'; // Tab por defecto

  constructor(
    private adminHorariosService: AdminHorariosService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  cargarDatos() {
    this.cargando = true;
    console.log('[DEBUG] Iniciando carga de horarios desde:', `${environment.apiUrl}/api/admin/horarios`);
    console.log('[DEBUG] Token presente:', !!localStorage.getItem('token'));
    
    this.adminHorariosService.getHorarios().subscribe({
      next: (res: any) => {
        console.log('[DEBUG] Respuesta recibida:', res);
        this.horarioSemanal = res.horarioSemanal || {};
        this.excepciones = Object.entries(res.excepciones || {}).map(([fecha, arr]: any) => ({ fecha, ...arr[0] }));
        this.cargando = false;
        console.log('[DEBUG] Datos cargados exitosamente');
      },
      error: (err) => {
        console.error('[ERROR] Error al cargar horarios:', err);
        console.error('[ERROR] Status:', err.status);
        console.error('[ERROR] Message:', err.message);
        this.error = `Error al cargar horarios: ${err.status === 401 ? 'No autenticado' : err.status === 403 ? 'Sin permisos' : err.message}`;
        this.cargando = false;
      }
    });
  }

  onHorarioChange(nuevo: any) {
    this.horarioSemanal = nuevo;
    // No guardar automáticamente - el usuario debe hacer clic en el botón
  }

  onExcepcionChange(nueva: any) {
    this.excepciones = nueva;
    // Refrescar datos después de cambios en excepciones
    this.cargarDatos();
  }

  guardarHorarios() {
    if (this.guardando) return; // Prevenir guardados múltiples
    
    this.guardando = true;
    this.error = ''; // Limpiar errores previos
    
    // Convertir el objeto horarioSemanal a array plano para el backend
    const diasMap: { [key: string]: number } = {
      'lunes': 1,
      'martes': 2,
      'miercoles': 3,
      'jueves': 4,
      'viernes': 5,
      'sabado': 6,
      'domingo': 0
    };

    const horariosArray = Object.entries(this.horarioSemanal).flatMap(([dia, bloques]: any) =>
      bloques.map((b: any) => ({
        dia_semana: diasMap[dia],
        hora_inicio: b.inicio || b.hora_inicio,
        hora_fin: b.fin || b.hora_fin,
        modalidad: b.modalidad,
        activo: true
      }))
    );

    // Deduplicar antes de enviar al backend
    const horariosUnicos = new Map();
    horariosArray.forEach(h => {
      const key = `${h.dia_semana}_${h.hora_inicio}_${h.hora_fin}_${h.modalidad}`;
      if (!horariosUnicos.has(key)) {
        horariosUnicos.set(key, h);
      } else {
        console.warn('[DUPLICADO-FRONTEND] Ignorando horario duplicado:', h);
      }
    });

    const horariosDeduplicados = Array.from(horariosUnicos.values());
    
    if (horariosDeduplicados.length !== horariosArray.length) {
      console.warn(`[DUPLICADOS-FRONTEND] Eliminados ${horariosArray.length - horariosDeduplicados.length} duplicados antes de enviar`);
    }

    console.log('[GUARDAR] Enviando horarios:', horariosDeduplicados);

    this.toastService.info('Guardando horarios...', 2000);

    this.adminHorariosService.actualizarHorarios(horariosDeduplicados).subscribe({
      next: () => {
        console.log('Horarios guardados exitosamente');
        this.toastService.success('✓ Horarios guardados correctamente');
        this.guardando = false;
      },
      error: (err) => {
        console.error('Error al guardar horarios:', err);
        if (err?.status === 409) {
          this.error = 'Hay horarios duplicados o solapados. Por favor, revisa la configuración.';
          this.toastService.error('Error: Hay horarios duplicados o solapados');
        } else {
          this.error = 'Error al guardar horarios';
          this.toastService.error('Error al guardar los horarios');
        }
        this.guardando = false;
      }
    });
  }
}
