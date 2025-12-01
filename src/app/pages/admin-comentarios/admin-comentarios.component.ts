import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComentariosService } from '../../services/comentarios.service';

@Component({
  selector: 'app-admin-comentarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-comentarios.component.html',
  styleUrls: ['./admin-comentarios.component.css']
})
export class AdminComentariosComponent implements OnInit {
  comentarios: any[] = [];
  comentariosFiltrados: any[] = [];
  filtro: 'todos' | 'aprobados' | 'pendientes' = 'todos';
  cargando = false;
  procesando: string | null = null;
  mensajeExito = '';
  mensajeError = '';

  stats = {
    total: 0,
    aprobados: 0,
    pendientes: 0,
    ratingPromedio: 0
  };

  constructor(private comentariosService: ComentariosService) {}

  ngOnInit() {
    this.cargarComentarios();
  }

  cargarComentarios() {
    this.cargando = true;
    this.comentariosService.getComentariosAdmin().subscribe({
      next: (response) => {
        this.comentarios = response.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        this.calcularEstadisticas();
        this.aplicarFiltro();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar comentarios:', error);
        this.mostrarError('Error al cargar comentarios');
        this.cargando = false;
      }
    });
  }

  calcularEstadisticas() {
    this.stats.total = this.comentarios.length;
    this.stats.aprobados = this.comentarios.filter(c => c.is_approved).length;
    this.stats.pendientes = this.comentarios.filter(c => !c.is_approved).length;
    
    if (this.comentarios.length > 0) {
      const suma = this.comentarios.reduce((acc, c) => acc + c.rating, 0);
      this.stats.ratingPromedio = Math.round((suma / this.comentarios.length) * 10) / 10;
    }
  }

  aplicarFiltro() {
    switch (this.filtro) {
      case 'aprobados':
        this.comentariosFiltrados = this.comentarios.filter(c => c.is_approved);
        break;
      case 'pendientes':
        this.comentariosFiltrados = this.comentarios.filter(c => !c.is_approved);
        break;
      default:
        this.comentariosFiltrados = [...this.comentarios];
    }
  }

  cambiarFiltro(nuevoFiltro: 'todos' | 'aprobados' | 'pendientes') {
    this.filtro = nuevoFiltro;
    this.aplicarFiltro();
  }

  aprobarComentario(comentarioId: string) {
    this.procesando = comentarioId;
    this.comentariosService.aprobarComentario(comentarioId).subscribe({
      next: () => {
        this.mostrarExito('Comentario aprobado exitosamente');
        this.cargarComentarios();
        this.procesando = null;
      },
      error: (error) => {
        console.error('Error al aprobar comentario:', error);
        this.mostrarError('Error al aprobar comentario');
        this.procesando = null;
      }
    });
  }

  rechazarComentario(comentarioId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      return;
    }

    this.procesando = comentarioId;
    this.comentariosService.eliminarComentario(comentarioId).subscribe({
      next: () => {
        this.mostrarExito('Comentario eliminado exitosamente');
        this.cargarComentarios();
        this.procesando = null;
      },
      error: (error) => {
        console.error('Error al eliminar comentario:', error);
        this.mostrarError('Error al eliminar comentario');
        this.procesando = null;
      }
    });
  }

  generarEstrellas(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  mostrarExito(mensaje: string) {
    this.mensajeExito = mensaje;
    setTimeout(() => this.mensajeExito = '', 3000);
  }

  mostrarError(mensaje: string) {
    this.mensajeError = mensaje;
    setTimeout(() => this.mensajeError = '', 3000);
  }
}
