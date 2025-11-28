import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface Paquete {
  id?: string;
  nombre: string;
  descripcion: string;
  duracion: number;
  modalidad: string;
  precio_nacional: number;
  precio_internacional?: number;
  sesiones: number;
  icono?: string;
  color: string;
  destacado: boolean;
  activo: boolean;
}

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
    nombre: '',
    descripcion: '',
    duracion: 60,
    modalidad: 'online',
    precio_nacional: 0,
    precio_internacional: undefined,
    sesiones: 1,
    icono: '',
    color: '#007bff',
    destacado: false,
    activo: true
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarPaquetes();
  }

  cargarPaquetes() {
    this.cargando = true;
    this.http.get<Paquete[]>(`${environment.apiUrl}/api/paquetes`).subscribe({
      next: (paquetes) => {
        this.paquetes = paquetes;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar paquetes:', err);
        this.cargando = false;
      }
    });
  }

  abrirModalNuevo() {
    this.editando = false;
    this.paqueteForm = {
      nombre: '',
      descripcion: '',
      duracion: 60,
      modalidad: 'online',
      precio_nacional: 0,
      precio_internacional: undefined,
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
    const url = this.editando
      ? `${environment.apiUrl}/api/paquetes/${this.paqueteForm.id}`
      : `${environment.apiUrl}/api/paquetes`;

    const method = this.editando ? 'put' : 'post';

    this.http[method](url, this.paqueteForm).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarPaquetes();
      },
      error: (err) => {
        console.error('Error al guardar paquete:', err);
      }
    });
  }

  eliminarPaquete(paquete: Paquete) {
    if (confirm(`¿Eliminar el paquete "${paquete.nombre}"?`)) {
      this.http.delete(`${environment.apiUrl}/api/paquetes/${paquete.id}`).subscribe({
        next: () => {
          this.cargarPaquetes();
        },
        error: (err) => {
          console.error('Error al eliminar paquete:', err);
        }
      });
    }
  }

  cerrarModal() {
    this.mostrarModal = false;
  }
}