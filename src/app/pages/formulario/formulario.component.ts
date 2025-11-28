import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Paquete } from '../../interfaces/paquetes.interface';
import { PaquetesService } from '../../services/paquetes.service';
import { ModalReservaComponent } from '../../components/modal-reserva/modal-reserva.component';

@Component({
  selector: 'app-formulario',
  standalone: true,
  imports: [CommonModule, ModalReservaComponent],
  templateUrl: './formulario.component.html',
  styleUrls: ['./formulario.component.css']
})
export class FormularioComponent implements OnInit {
  paquetes: Paquete[] = [];
  paqueteSeleccionado: Paquete | null = null;
  mostrarModal = false;
  cargando = true;
  error = '';

  constructor(private paquetesService: PaquetesService) {}

  ngOnInit() {
    this.cargarPaquetes();
  }

  cargarPaquetes() {
    this.cargando = true;
    this.paquetesService.getPaquetes().subscribe({
      next: (paquetes) => {
        this.paquetes = paquetes.filter(p => p.activo);
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar paquetes:', err);
        this.error = 'Error al cargar los paquetes';
        this.cargando = false;
      }
    });
  }

  abrirModal(paquete: Paquete) {
    this.paqueteSeleccionado = paquete;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.paqueteSeleccionado = null;
  }

  onReservaCompletada(response: any) {
    console.log('Reserva completada:', response);
    // Aquí puedes redirigir o mostrar un mensaje de éxito
  }

  getIconoModalidad(modalidad: string): string {
    return this.paquetesService.getIconoModalidad(modalidad);
  }

  getPrecio(paquete: Paquete): string {
    return this.paquetesService.getPrecio(paquete, false);
  }
}
