import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCitasService, CitaDetalle } from '../../../../services/admin-citas.service';

@Component({
  selector: 'app-modal-detalle-cita',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-detalle-cita.component.html',
  styleUrls: ['./modal-detalle-cita.component.css']
})
export class ModalDetalleCitaComponent implements OnInit {
  @Input() citaId: number | null = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() citaActualizada = new EventEmitter<void>();

  cita: CitaDetalle | null = null;
  cargando = true;
  error = '';

  // Modo edición
  modoEdicion = false;
  notasEditadas = '';

  // Modo reagendar
  modoReagendar = false;
  reagendarForm = {
    fecha: '',
    hora_inicio: '',
    hora_fin: ''
  };

  // Estados disponibles
  estadosDisponibles = [
    { valor: 'confirmada', etiqueta: 'Confirmada', color: '#22c55e' },
    { valor: 'pendiente', etiqueta: 'Pendiente', color: '#f59e0b' },
    { valor: 'cancelada', etiqueta: 'Cancelada', color: '#ef4444' },
    { valor: 'completada', etiqueta: 'Completada', color: '#3b82f6' }
  ];

  constructor(private adminCitasService: AdminCitasService) {}

  ngOnInit() {
    if (this.citaId) {
      this.cargarDetalleCita();
    }
  }

  cargarDetalleCita() {
    if (!this.citaId) return;

    this.cargando = true;
    this.error = '';

    this.adminCitasService.obtenerDetalleCita(this.citaId).subscribe({
      next: (data) => {
        this.cita = data;
        this.notasEditadas = data.notas || '';
        this.cargando = false;
        console.log('[MODAL-DETALLE] Cita cargada:', data);
      },
      error: (err) => {
        console.error('[MODAL-DETALLE] Error al cargar cita:', err);
        this.error = 'Error al cargar los detalles de la cita';
        this.cargando = false;
      }
    });
  }

  cerrarModal() {
    this.cerrar.emit();
  }

  // ==========================================
  // CAMBIAR ESTADO
  // ==========================================
  cambiarEstado(nuevoEstado: string) {
    if (!this.cita || !this.citaId) return;

    const confirmar = confirm(`¿Cambiar el estado de la cita a "${nuevoEstado}"?`);
    if (!confirmar) return;

    this.adminCitasService.actualizarEstadoCita(this.citaId, nuevoEstado).subscribe({
      next: () => {
        if (this.cita) {
          this.cita.estado = nuevoEstado;
        }
        this.citaActualizada.emit();
        alert('Estado actualizado correctamente');
      },
      error: (err) => {
        console.error('[MODAL-DETALLE] Error al cambiar estado:', err);
        alert('Error al cambiar el estado de la cita');
      }
    });
  }

  // ==========================================
  // EDITAR NOTAS
  // ==========================================
  activarEdicionNotas() {
    this.modoEdicion = true;
  }

  cancelarEdicionNotas() {
    this.modoEdicion = false;
    this.notasEditadas = this.cita?.notas || '';
  }

  guardarNotas() {
    if (!this.citaId) return;

    this.adminCitasService.actualizarNotasCita(this.citaId, this.notasEditadas).subscribe({
      next: () => {
        if (this.cita) {
          this.cita.notas = this.notasEditadas;
        }
        this.modoEdicion = false;
        this.citaActualizada.emit();
        alert('Notas actualizadas correctamente');
      },
      error: (err) => {
        console.error('[MODAL-DETALLE] Error al actualizar notas:', err);
        alert('Error al actualizar las notas');
      }
    });
  }

  // ==========================================
  // REAGENDAR
  // ==========================================
  activarReagendar() {
    if (!this.cita) return;
    
    this.modoReagendar = true;
    this.reagendarForm = {
      fecha: this.cita.fecha,
      hora_inicio: this.cita.hora_inicio,
      hora_fin: this.cita.hora_fin
    };
  }

  cancelarReagendar() {
    this.modoReagendar = false;
  }

  confirmarReagendar() {
    if (!this.citaId) return;

    const confirmar = confirm('¿Estás seguro de reagendar esta cita?');
    if (!confirmar) return;

    this.adminCitasService.reagendarCita(this.citaId, {
      nueva_fecha: this.reagendarForm.fecha,
      nueva_hora_inicio: this.reagendarForm.hora_inicio,
      nueva_hora_fin: this.reagendarForm.hora_fin
    }).subscribe({
      next: (response: any) => {
        this.modoReagendar = false;
        this.citaActualizada.emit();
        this.cerrarModal();
        alert(response?.message || 'Cita reagendada correctamente');
      },
      error: (err) => {
        console.error('[MODAL-DETALLE] Error al reagendar:', err);
        const mensaje = err.error?.message || err.message || 'Error al reagendar la cita';
        alert(mensaje);
      }
    });
  }

  // ==========================================
  // CANCELAR CITA
  // ==========================================
  cancelarCita() {
    if (!this.citaId) return;

    const motivo = prompt('¿Motivo de la cancelación? (opcional)');
    if (motivo === null) return; // Usuario canceló el prompt

    const confirmar = confirm('¿Estás seguro de cancelar esta cita? Esta acción no se puede deshacer.');
    if (!confirmar) return;

    this.adminCitasService.cancelarCita(this.citaId, motivo || undefined).subscribe({
      next: () => {
        this.citaActualizada.emit();
        this.cerrarModal();
        alert('Cita cancelada correctamente');
      },
      error: (err) => {
        console.error('[MODAL-DETALLE] Error al cancelar:', err);
        alert('Error al cancelar la cita');
      }
    });
  }

  // ==========================================
  // HELPERS
  // ==========================================
  formatearFecha(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  obtenerColorEstado(estado: string): string {
    const est = this.estadosDisponibles.find(e => e.valor === estado);
    return est?.color || '#6b7280';
  }

  obtenerEtiquetaEstado(estado: string): string {
    const est = this.estadosDisponibles.find(e => e.valor === estado);
    return est?.etiqueta || estado;
  }
}
