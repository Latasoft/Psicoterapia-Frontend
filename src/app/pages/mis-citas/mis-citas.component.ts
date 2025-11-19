import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitasService } from '../../services/citas.service';
import { AuthService } from '../../services/auth.service';

interface Cita {
  id: string;
  appointment_datetime: string;
  status: string;
  notes?: string;
  created_at: string;
  treatments: {
    id: string;
    name: string;
    description: string;
    price_national: number;
    price_international: number;
    sessions: number;
  };
  patients: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    city: string;
  };
}

@Component({
  selector: 'app-mis-citas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-citas.component.html',
  styleUrls: ['./mis-citas.component.css']
})
export class MisCitasComponent implements OnInit {
  citas: Cita[] = [];
  citasFiltradas: Cita[] = [];
  isLoading = false;
  errorMessage = '';
  filtroEstado = 'todas'; // todas, pendiente, confirmada, cancelada

  constructor(
    private citasService: CitasService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarMisCitas();
  }

  cargarMisCitas(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.citasService.obtenerMisCitas().subscribe({
      next: (response) => {
        this.citas = response;
        this.aplicarFiltro();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar citas:', error);
        this.errorMessage = 'Error al cargar tus citas. Intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  aplicarFiltro(): void {
    if (this.filtroEstado === 'todas') {
      this.citasFiltradas = [...this.citas];
    } else {
      this.citasFiltradas = this.citas.filter(
        cita => cita.status === this.filtroEstado
      );
    }
  }

  onFiltroChange(): void {
    this.aplicarFiltro();
  }

  cancelarCita(cita: Cita): void {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      return;
    }

    this.citasService.cancelarCita(cita.id).subscribe({
      next: () => {
        cita.status = 'cancelled';
        this.aplicarFiltro();
      },
      error: (error) => {
        console.error('Error al cancelar cita:', error);
        alert('Error al cancelar la cita. Intenta nuevamente.');
      }
    });
  }

  getEstadoClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'estado-pendiente';
      case 'confirmed':
        return 'estado-confirmada';
      case 'cancelled':
        return 'estado-cancelada';
      case 'completed':
        return 'estado-completada';
      default:
        return '';
    }
  }

  getEstadoTexto(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'confirmed':
        return 'Confirmada';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  puedeReagendar(cita: Cita): boolean {
    return cita.status === 'pending' || cita.status === 'confirmed';
  }

  puedeCancelar(cita: Cita): boolean {
    return cita.status === 'pending' || cita.status === 'confirmed';
  }
}
