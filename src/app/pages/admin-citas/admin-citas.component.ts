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

// Interfaz para cita
interface Cita {
  id: string;
  nombre: string;
  correo: string;
  estado: string;
  fecha_hora: Date | string; // manejamos Date o string (antes de normalizar)
  precio: Precio | any;
  tratamiento: string;
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
          // Normalizar fecha_hora: convertir Firestore Timestamp a Date, o parsear string
          if ((cita.fecha_hora as any)?._seconds) {
            cita.fecha_hora = new Date((cita.fecha_hora as any)._seconds * 1000);
          } else if (typeof cita.fecha_hora === 'string') {
            cita.fecha_hora = new Date(cita.fecha_hora);
          }

          // Normalizar precio a tu formato consistente
          if (cita.precio) {
            cita.precio = {
              precioNacional: cita.precio.precioNacional ?? cita.precio.nacional ?? null,
              precioInternacional: cita.precio.precioInternacional ?? cita.precio.internacional ?? null,
              sesiones: cita.precio.sesiones ?? null,
            };
          }

          // Normalizar tratamiento a string si viene como objeto
          if (typeof cita.tratamiento !== 'string' && cita.tratamiento) {
            cita.tratamiento = cita.tratamiento;
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
      this.citasFiltradas = this.citas;  // Si no hay búsqueda, mostrar todas las citas
    } else {
      this.citasFiltradas = this.citas.filter(cita =>
        cita.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        cita.correo.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        cita.tratamiento.toLowerCase().includes(this.busqueda.toLowerCase())
      );
    }
  }

  // Método para iniciar la edición de la cita
  editarCita(cita: Cita): void {
    this.citaAEditar = { ...cita }; // Guardar una copia de la cita a editar
    // Si la fecha es Date, convertir a string para input datetime-local
    if (cita.fecha_hora instanceof Date) {
      this.nuevaFechaHora = cita.fecha_hora.toISOString().slice(0,16);
    } else {
      this.nuevaFechaHora = cita.fecha_hora as string;
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
