import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CitasService } from '../../services/citas.service';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tratamientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tratamientos.component.html',
  styleUrls: ['./tratamientos.component.css']
})
export class TratamientosComponent implements OnInit {

  tratamientos: any[] = [];
  tratamientoEditado: any = null;
  tratamientosFiltrados: any[] = [];
  busqueda: string = '';

  mostrarFormulario: boolean = false;
  modoEdicion: boolean = false;

  // Modelo para el formulario
  tratamientoForm = {
    nombre: '',
    precioNacional: null,
    precioInternacional: null,
    sesiones: null
  };

  @ViewChild('formularioElement') formularioElement!: ElementRef;

  constructor(private citasService: CitasService) {}

  ngOnInit(): void {
    this.cargarTratamientos();
  }

  cargarTratamientos(): void {
    this.citasService.obtenerTratamientos().subscribe({
      next: (data) => {
        this.tratamientos = data;
        this.tratamientosFiltrados = data;
      },
      error: (err) => console.error('Error al cargar tratamientos', err)
    });
  }

  buscarTratamientos() {
    const texto = this.busqueda.toLowerCase();
    this.tratamientosFiltrados = this.tratamientos.filter(t =>
      t.nombre.toLowerCase().includes(texto)
    );
  }

  limpiarFormulario() {
    this.tratamientoForm = {
      nombre: '',
      precioNacional: null,
      precioInternacional: null,
      sesiones: null
    };
    this.modoEdicion = false;
    this.tratamientoEditado = null;
  }

  guardarTratamiento(form: NgForm) {
    if (form.invalid) return;

    if (this.modoEdicion && this.tratamientoEditado) {
      // Actualizar tratamiento
      this.citasService.actualizarTratamiento(this.tratamientoEditado.id, this.tratamientoForm).subscribe({
        next: () => {
          this.cargarTratamientos();
          this.mostrarFormulario = false;
          this.limpiarFormulario();
        },
        error: (err) => console.error('Error al actualizar tratamiento', err)
      });
    } else {
      // Crear nuevo tratamiento
      this.citasService.crearTratamiento(this.tratamientoForm).subscribe({
        next: () => {
          this.cargarTratamientos();
          this.mostrarFormulario = false;
          this.limpiarFormulario();
        },
        error: (err) => console.error('Error al crear tratamiento', err)
      });
    }
  }

  mostrarFormularioCrear() {
  this.modoEdicion = false;
  this.limpiarFormulario();
  this.mostrarFormulario = true;
  

}

editarTratamiento(tratamiento: any) {
  this.modoEdicion = true;
  this.tratamientoEditado = tratamiento;
  this.tratamientoForm = {
    nombre: tratamiento.nombre,
    precioNacional: tratamiento.precioNacional,
    precioInternacional: tratamiento.precioInternacional,
    sesiones: tratamiento.sesiones
  };
  this.mostrarFormulario = true;
  
}

  eliminarTratamiento(id: string) {
    if (!confirm('¿Seguro que deseas eliminar este tratamiento?')) return;

    this.citasService.eliminarTratamiento(id).subscribe({
      next: () => this.cargarTratamientos(),
      error: (err) => console.error('Error al eliminar tratamiento', err)
    });
  }

  cancelarFormulario() {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
  }
}
