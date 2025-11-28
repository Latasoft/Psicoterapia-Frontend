import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Paquete } from '../../../interfaces/paquetes.interface';
import { PaquetesService } from '../../../services/paquetes.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-catalogo-paquetes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo-paquetes.component.html',
  styleUrls: ['./catalogo-paquetes.component.css']
})
export class CatalogoPaquetesComponent implements OnInit {
  paquetes: Paquete[] = [];
  cargando = true;
  mostrarModal = false;
  editando = false;
  paqueteForm: Paquete = {
    id: '',
    nombre: '',
    descripcion: '',
    duracion: 60,
    modalidad: 'online',
    precio_nacional: 0,
    precio_internacional: 0,
    sesiones: 1,
    icono: '',
    color: '#007bff',
    destacado: false,
    activo: true
  };

  constructor(
    private paquetesService: PaquetesService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.cargarPaquetes();
  }

  cargarPaquetes() {
    this.cargando = true;
    // Usar getAllPaquetes si el usuario está autenticado, si no usar el método público
    const token = localStorage.getItem('token');
    if (token) {
      this.paquetesService.getAllPaquetes().subscribe({
        next: (paquetes) => {
          this.paquetes = paquetes;
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al cargar paquetes (admin):', err);
          // Fallback: usar getPaquetes si falla el endpoint admin
          this.cargarPaquetesPublico();
        }
      });
    } else {
      this.cargarPaquetesPublico();
    }
  }

  cargarPaquetesPublico() {
    this.paquetesService.getPaquetes().subscribe({
      next: (paquetes) => {
        this.paquetes = paquetes;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar paquetes:', err);
        this.toastService.error('Error al cargar el catálogo de paquetes');
        this.paquetes = [];
        this.cargando = false;
      }
    });
  }

  abrirModalNuevo() {
    this.editando = false;
    this.paqueteForm = {
      id: '',
      nombre: '',
      descripcion: '',
      duracion: 60,
      modalidad: 'online',
      precio_nacional: 0,
      precio_internacional: 0,
      sesiones: 1,
      icono: '',
      color: '#007bff',
      destacado: false,
      activo: true
    };
    this.mostrarModal = true;
  }

  editarPaquete(paquete: Paquete) {
    this.editando = true;
    this.paqueteForm = { ...paquete };
    this.mostrarModal = true;
  }

  guardarPaquete() {
    if (this.editando) {
      this.paquetesService.updatePaquete(this.paqueteForm.id!, this.paqueteForm).subscribe({
        next: (paquete) => {
          this.toastService.success('✓ Paquete actualizado correctamente');
          this.cerrarModal();
          this.cargarPaquetes();
        },
        error: (err) => {
          console.error('Error al actualizar paquete:', err);
          this.toastService.error('Error al actualizar el paquete');
        }
      });
    } else {
      this.paquetesService.createPaquete(this.paqueteForm).subscribe({
        next: (paquete) => {
          this.toastService.success('✓ Paquete creado correctamente');
          this.cerrarModal();
          this.cargarPaquetes();
        },
        error: (err) => {
          console.error('Error al crear paquete:', err);
          this.toastService.error('Error al crear el paquete');
        }
      });
    }
  }

  eliminarPaquete(paquete: Paquete) {
    if (confirm(`¿Eliminar el paquete "${paquete.nombre}"?`)) {
      this.paquetesService.deletePaquete(paquete.id!).subscribe({
        next: () => {
          this.toastService.success('✓ Paquete eliminado correctamente');
          this.cargarPaquetes();
        },
        error: (err) => {
          console.error('Error al eliminar paquete:', err);
          this.toastService.error('Error al eliminar el paquete');
        }
      });
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
  }
}