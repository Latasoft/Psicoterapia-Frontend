import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TallerService } from '../../services/taller.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-taller',
   imports: [
    ReactiveFormsModule, CommonModule,RouterModule
  ],
  templateUrl: './admin-taller.component.html',
  styleUrls: ['./admin-taller.component.css']
})
export class AdminTallerComponent implements OnInit {
  talleres: any[] = [];
  form!: FormGroup;
  modoEdicion = false;
  tallerEditandoId: string | null = null;

  constructor(private tallerService: TallerService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      subtitulo: [''],
      fechaInicio: [''],
      valor: [''],
      facilitador: [''],
      descripcionDeServicio: [''],
      politicaDeCancelacion: [''],
      datosDeContacto: [''],
      proximasSesiones: this.fb.array([])
    });

    this.obtenerTalleres();
  }

  obtenerTalleres() {
    this.tallerService.getTalleres().subscribe({
      next: (data) => {
        console.log('Talleres recibidos:', data);
        this.talleres = data;
      },
      error: (error) => {
        console.error('Error al traer talleres:', error);
      }
    });
  }

  editarTaller(taller: any) {
    this.modoEdicion = true;
    this.tallerEditandoId = taller.id;

    this.form.patchValue({
      subtitulo: taller.subtitulo,
      fechaInicio: taller.fechaInicio,
      valor: taller.valor,
      facilitador: taller.facilitador,
      descripcionDeServicio: taller.descripcionDeServicio,
      politicaDeCancelacion: taller.politicaDeCancelacion,
      datosDeContacto: taller.datosDeContacto
    });

    this.proximasSesiones.clear();
    taller.proximasSesiones.forEach((sesion: any) => {
      this.proximasSesiones.push(this.crearSesionForm(sesion));
    });
  }

  guardarCambios() {
    if (!this.tallerEditandoId) return;

    const formData = this.form.value;

    const tallerActualizado = {
      subtitulo: formData.subtitulo,
      fechaInicio: formData.fechaInicio,
      valor: formData.valor,
      facilitador: formData.facilitador,
      descripcionDeServicio: { texto: formData.descripcionDeServicio },
      politicaDeCancelacion: { texto: formData.politicaDeCancelacion },
      datosDeContacto: { texto: formData.datosDeContacto },
      proximasSesiones: this.proximasSesiones.value
    };

    this.tallerService.editarTaller(this.tallerEditandoId, tallerActualizado).subscribe({
      next: () => {
        alert('Taller actualizado');
        this.modoEdicion = false;
        this.tallerEditandoId = null;
        this.form.reset();
        this.proximasSesiones.clear(); // limpiar sesiones del formulario
        this.obtenerTalleres();
      },
      error: (err) => {
        console.error(err);
        alert('Error al actualizar el taller');
      }
    });
  }

  cancelarEdicion() {
    this.modoEdicion = false;
    this.tallerEditandoId = null;
    this.form.reset();
    this.proximasSesiones.clear();
  }

  get proximasSesiones(): FormArray {
    return this.form.get('proximasSesiones') as FormArray;
  }

  crearSesionForm(sesion: any = {}): FormGroup {
    return this.fb.group({
      dia: [sesion.dia || ''],
      fecha: [sesion.fecha || ''],
      hora: [sesion.hora || ''],
      duracionHoras: [sesion.duracionHoras || 0],
      duracionMinutos: [sesion.duracionMinutos || 0],
      profesional: [sesion.profesional || '']
    });
  }

  agregarSesion() {
    this.proximasSesiones.push(this.crearSesionForm());
  }

  eliminarSesion(index: number) {
    this.proximasSesiones.removeAt(index);
  }


  eliminarTaller(id: string) {
  if (confirm('¿Estás seguro que querés eliminar este taller?')) {
    this.tallerService.eliminarTaller(id).subscribe({
      next: () => {
        alert('Taller eliminado con éxito');
        this.obtenerTalleres(); // refrescar la lista
        if (this.modoEdicion && this.tallerEditandoId === id) {
          this.cancelarEdicion(); // si estás editando el taller eliminado, salir del modo edición
        }
      },
      error: (err) => {
        console.error('Error al eliminar taller:', err);
        alert('Error al eliminar el taller');
      }
    });
  }
}

}
