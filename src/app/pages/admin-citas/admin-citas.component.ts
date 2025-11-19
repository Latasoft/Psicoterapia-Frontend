import { Component, OnInit } from '@angular/core';
import { CitasService } from '../../services/citas.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// Definimos una interfaz para la estructura de precio
interface Precio {
  precioNacional: number | null;
  precioInternacional: number | null;
  sesiones: number | null;
}

// Interfaz para paciente
interface Paciente {
  id: string;
  full_name: string;
  email: string;
  rut?: string;
  phone?: string;
  city?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_notes?: string;
}

// Interfaz para tratamiento
interface Tratamiento {
  id: string;
  name: string;
  price_national: number;
  price_international: number;
}

// Interfaz para cita (nuevo formato)
interface Cita {
  id: string;
  appointment_datetime: Date | string;
  status: string;
  notes?: string;
  price_national?: number;
  price_international?: number;
  sessions?: number;
  patients?: Paciente;
  treatments?: Tratamiento;
  // Campos legacy (por compatibilidad temporal)
  nombre?: string;
  correo?: string;
  estado?: string;
  fecha_hora?: Date | string;
  precio?: Precio | any;
  tratamiento?: string;
}

@Component({
  selector: 'app-admin-citas',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-citas.component.html',
  styleUrls: ['./admin-citas.component.css']
})
export class AdminCitasComponent implements OnInit {
  citas: Cita[] = [];
  citasFiltradas: Cita[] = [];  // Guardar las citas filtradas
  busqueda: string = ''; // Valor del buscador
  nuevaFechaHora: string = ''; // Para reprogramar
  citaAEditar: Cita | null = null;  // Cita que se está editando
  showConfirmation: boolean = false;
  mensajeConfirmacion: string = '';
  citaParaCancelar: Cita | null = null;  
  
  constructor(private citasService: CitasService, private http: HttpClient) {}

  ngOnInit(): void {
    this.citasService.obtenerCitas().subscribe({
      next: (data: Cita[]) => {
        this.citas = data.map((cita: Cita) => {
          // Normalizar fecha: nuevo formato usa appointment_datetime
          const fechaHora = cita.appointment_datetime || cita.fecha_hora;
          if ((fechaHora as any)?._seconds) {
            cita.appointment_datetime = new Date((fechaHora as any)._seconds * 1000);
          } else if (typeof fechaHora === 'string') {
            cita.appointment_datetime = new Date(fechaHora);
          }

          // Normalizar datos del paciente (nuevo formato con JOIN)
          if (cita.patients) {
            cita.nombre = cita.patients.full_name;
            cita.correo = cita.patients.email;
          }

          // Normalizar estado
          cita.estado = cita.status || cita.estado || 'pending';

          // Normalizar tratamiento (nuevo formato con JOIN)
          if (cita.treatments) {
            cita.tratamiento = cita.treatments.name;
            cita.precio = {
              precioNacional: cita.treatments.price_national,
              precioInternacional: cita.treatments.price_international,
              sesiones: cita.sessions
            };
          } else if (cita.precio) {
            // Formato legacy
            cita.precio = {
              precioNacional: cita.precio.precioNacional ?? cita.precio.nacional ?? cita.price_national ?? null,
              precioInternacional: cita.precio.precioInternacional ?? cita.precio.internacional ?? cita.price_international ?? null,
              sesiones: cita.precio.sesiones ?? cita.sessions ?? null,
            };
          }

          return cita;
        });

        this.citasFiltradas = [...this.citas];
        console.log('Citas normalizadas:', this.citas);
      },
      error: (err) => {
        console.error('Error al obtener las citas:', err);
      }
    });
  }

  // Método para filtrar citas
  buscarCitas(): void {
    if (this.busqueda.trim() === '') {
      this.citasFiltradas = this.citas;
    } else {
      const searchTerm = this.busqueda.toLowerCase();
      this.citasFiltradas = this.citas.filter(cita =>
        (cita.nombre && cita.nombre.toLowerCase().includes(searchTerm)) ||
        (cita.correo && cita.correo.toLowerCase().includes(searchTerm)) ||
        (cita.tratamiento && cita.tratamiento.toLowerCase().includes(searchTerm)) ||
        (cita.patients?.rut && cita.patients.rut.toLowerCase().includes(searchTerm)) ||
        (cita.patients?.phone && cita.patients.phone.includes(searchTerm))
      );
    }
  }

  // Método para iniciar la edición de la cita
  editarCita(cita: Cita): void {
    this.citaAEditar = { ...cita };
    // Usar appointment_datetime (nuevo formato)
    const fechaHora = cita.appointment_datetime || cita.fecha_hora;
    if (fechaHora instanceof Date) {
      this.nuevaFechaHora = fechaHora.toISOString().slice(0,16);
    } else if (typeof fechaHora === 'string') {
      this.nuevaFechaHora = new Date(fechaHora).toISOString().slice(0,16);
    }
  }

  // Método para guardar los cambios de la cita
  guardarCambios(): void {
    if (this.citaAEditar && this.nuevaFechaHora) {
      this.citasService.reagendarCita(this.citaAEditar.id, this.nuevaFechaHora).subscribe({
        next: (response) => {
          alert('✅ Cita actualizada exitosamente');
          this.citaAEditar = null; // Limpiar la cita a editar
          this.nuevaFechaHora = ''; // Limpiar la fecha
          this.ngOnInit(); // Actualizar la lista de citas
        },
        error: (err) => {
          console.error('Error al reagendar la cita:', err);
          alert('Hubo un error al reagendar la cita');
        }
      });
    }
  }

  // Método para cancelar la edición de la cita
  cancelarEdicion(): void {
    this.citaAEditar = null;
    this.nuevaFechaHora = '';
  }

  mostrarConfirmacion(mensaje: string): void {
    this.mensajeConfirmacion = mensaje;
    this.showConfirmation = true;
  }

  cerrarConfirmacion(): void {
    this.showConfirmation = false;
    this.mensajeConfirmacion = '';
  }

  confirmarCancelacion(cita: Cita): void {
    this.citaParaCancelar = cita;
    this.mostrarConfirmacion('¿Estás seguro de que quieres cancelar esta cita?');
  }

  cancelarCita(): void {
    if (this.citaParaCancelar) {
      this.citasService.cancelarCita(this.citaParaCancelar.id).subscribe({
        next: () => {
          this.ngOnInit();
          this.cerrarConfirmacion();
        },
        error: () => {
          alert('Hubo un error al cancelar la cita.');
          this.cerrarConfirmacion();
        }
      });
    }
  }

}
