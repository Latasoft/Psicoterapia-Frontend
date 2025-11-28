import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-excepciones-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './excepciones-list.component.html',
  styleUrls: ['./excepciones-list.component.css']
})
export class ExcepcionesListComponent {
  @Input() excepciones: any[] = [];
  @Output() excepcionChange = new EventEmitter<any>();
  guardando = false;

  agregarExcepcion() {
    this.excepciones.push({ fecha: '', hora_inicio: '', hora_fin: '', motivo: '', bloqueado: false });
    this.excepcionChange.emit(this.excepciones);
  }

  eliminarExcepcion(i: number) {
    this.excepciones.splice(i, 1);
    this.excepcionChange.emit(this.excepciones);
  }

  guardarCambios() {
    this.guardando = true;
    // Emitir cambios para que el padre maneje el guardado
    this.excepcionChange.emit(this.excepciones);
    setTimeout(() => {
      this.guardando = false;
    }, 1000);
  }
}
