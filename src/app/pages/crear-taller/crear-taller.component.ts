import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TallerService } from '../../services/taller.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-crear-taller',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterModule],
  templateUrl: './crear-taller.component.html',
  styleUrls: ['./crear-taller.component.css']
})
export class CrearTallerComponent implements OnInit {

  tallerForm!: FormGroup;
  seccionActual = 1;

  constructor(private fb: FormBuilder, private tallerService: TallerService) { }

  mostrarSeccion1 = true;
  mostrarSeccion2 = true;
  mostrarSeccion3 = true;

  ngOnInit(): void {
    this.tallerForm = this.fb.group({
      subtitulo: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      valor: ['', Validators.required],
      facilitador: ['', Validators.required],
      descripcionDeServicio: this.fb.group({
        texto: ['', Validators.required]
      }),
      proximasSesiones: this.fb.array([
        this.crearSesion()
      ]),
      politicaDeCancelacion: this.fb.group({
        texto: ['', Validators.required]
      }),
      datosDeContacto: this.fb.group({
        texto: ['', Validators.required]
      })
    });
  }

  // Getter para acceder más fácilmente al array de sesiones
  get proximasSesiones(): FormArray {
    return this.tallerForm.get('proximasSesiones') as FormArray;
  }

  crearSesion(): FormGroup {
    return this.fb.group({
      dia: ['', Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      duracionHoras: ['', Validators.required],
      duracionMinutos: ['', Validators.required],
      profesional: ['', Validators.required]
    });
  }

  agregarSesion(): void {
    this.proximasSesiones.push(this.crearSesion());
  }

  eliminarSesion(index: number): void {
    this.proximasSesiones.removeAt(index);
  }

  enviarFormulario(): void {
    if (this.tallerForm.valid) {
      const datosParaEnviar = {
        titulo: 'Taller de Duelo',
        ...this.tallerForm.value
      };

      this.tallerService.crearTaller(datosParaEnviar).subscribe({
        next: (res) => {
          alert('¡Taller creado con éxito!');
          this.tallerForm.reset();
          this.proximasSesiones.clear();
          this.agregarSesion(); // Agrega una sesión vacía por defecto tras limpiar
          this.seccionActual = 1; // Regresa a la sección 1
        },

        error: (err) => {
          console.error('Error al crear taller:', err);
          alert('Error al crear taller. Intenta de nuevo.');
        }
      });
    } else {
      alert('Por favor completa todos los campos obligatorios.');
      this.tallerForm.markAllAsTouched(); // marca todos los campos como "tocados"
    }
  }
  irASeccion(n: number) {
    this.seccionActual = n;
  }

  siguienteSeccion() {
    if (this.validarSeccionActual()) {
      this.seccionActual++;
    }
  }

  anteriorSeccion() {
    if (this.seccionActual > 1) {
      this.seccionActual--;
    }
  }

  validarSeccionActual(): boolean {
    switch (this.seccionActual) {
      case 1:
        return !!this.tallerForm.get('subtitulo')?.valid &&
          !!this.tallerForm.get('fechaInicio')?.valid &&
          !!this.tallerForm.get('valor')?.valid &&
          !!this.tallerForm.get('facilitador')?.valid &&
          !!this.tallerForm.get('descripcionDeServicio.texto')?.valid;
      case 2:
        return this.proximasSesiones.controls.every(ctrl => ctrl.valid);
      case 3:
        return !!this.tallerForm.get('politicaDeCancelacion.texto')?.valid &&
          !!this.tallerForm.get('datosDeContacto.texto')?.valid;
      default:
        return false;
    }
  }


}
