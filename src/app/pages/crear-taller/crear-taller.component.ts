import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TallerService } from '../../services/taller.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

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

  constructor(private fb: FormBuilder, private tallerService: TallerService, private router: Router) { }

  mostrarSeccion1 = true;
  mostrarSeccion2 = true;
  mostrarSeccion3 = true;

  ngOnInit(): void {
    this.tallerForm = this.fb.group({
      subtitulo: ['', Validators.required],
      valor: ['', [Validators.required, Validators.min(0)]],
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
      duracionHoras: [null],
      duracionMinutos: [null],
      profesional: ['', Validators.required]
    }, { validators: this.duracionValidator });
  }

  duracionValidator(group: FormGroup): { [key: string]: boolean } | null {
    const horas = group.get('duracionHoras')?.value;
    const minutos = group.get('duracionMinutos')?.value;
    
    // Convertir null/undefined/'' a 0
    const horasNum = horas === null || horas === undefined || horas === '' ? 0 : Number(horas);
    const minutosNum = minutos === null || minutos === undefined || minutos === '' ? 0 : Number(minutos);
    
    // Ambos deben ser 0 (o vacíos) para que sea inválido
    if (horasNum === 0 && minutosNum === 0) {
      return { duracionRequerida: true };
    }
    return null;
  }

  agregarSesion(): void {
    this.proximasSesiones.push(this.crearSesion());
  }

  eliminarSesion(index: number): void {
    this.proximasSesiones.removeAt(index);
  }

  enviarFormulario(): void {
    if (this.tallerForm.valid) {
      const confirmacion = confirm('¿Estás seguro de que deseas crear este taller?');
      if (!confirmacion) {
        return;
      }

      // Tomar la fecha de la primera sesión como fechaInicio
      const fechaInicio = this.proximasSesiones.at(0)?.get('fecha')?.value || '';

      const datosParaEnviar = {
        titulo: 'Taller de Duelo',
        subtitulo: this.tallerForm.get('subtitulo')?.value,
        fechaInicio: fechaInicio,
        valor: this.tallerForm.get('valor')?.value,
        facilitador: this.tallerForm.get('facilitador')?.value,
        descripcionDeServicio: {
          texto: this.tallerForm.get('descripcionDeServicio.texto')?.value || ''
        },
        proximasSesiones: this.tallerForm.get('proximasSesiones')?.value.map((sesion: any) => ({
          ...sesion,
          duracionHoras: sesion.duracionHoras ?? 0, // Convertir null/undefined a 0
          duracionMinutos: sesion.duracionMinutos ?? 0 // Convertir null/undefined a 0
        })),
        politicaDeCancelacion: {
          texto: this.tallerForm.get('politicaDeCancelacion.texto')?.value || ''
        },
        datosDeContacto: {
          texto: this.tallerForm.get('datosDeContacto.texto')?.value || ''
        }
      };

      this.tallerService.crearTaller(datosParaEnviar).subscribe({
        next: (res) => {
          alert('¡Taller creado con éxito!');
          this.router.navigate(['/admin-taller']);
        },

        error: (err) => {
          alert('Error al crear taller.');
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
      if (this.seccionActual < 3) {
        this.seccionActual++;
      }
    } else {
      this.marcarCamposComoTocados();
      
      if (this.seccionActual === 2) {
        const sesionesIncompletas = this.proximasSesiones.controls.filter(c => c.invalid).length;
        alert(`Tienes ${sesionesIncompletas} sesión(es) incompleta(s). Por favor completa todos los campos de cada sesión antes de continuar.`);
      } else {
        alert('Por favor completa todos los campos obligatorios de esta sección antes de continuar.');
      }
    }
  }

  marcarCamposComoTocados() {
    switch (this.seccionActual) {
      case 1:
        this.tallerForm.get('subtitulo')?.markAsTouched();
        this.tallerForm.get('valor')?.markAsTouched();
        this.tallerForm.get('facilitador')?.markAsTouched();
        this.tallerForm.get('descripcionDeServicio.texto')?.markAsTouched();
        break;
      case 2:
        this.proximasSesiones.controls.forEach(control => {
          control.markAllAsTouched();
        });
        break;
      case 3:
        this.tallerForm.get('politicaDeCancelacion.texto')?.markAsTouched();
        this.tallerForm.get('datosDeContacto.texto')?.markAsTouched();
        break;
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
          !!this.tallerForm.get('valor')?.valid &&
          !!this.tallerForm.get('facilitador')?.valid &&
          !!this.tallerForm.get('descripcionDeServicio.texto')?.valid;
      case 2:
        // Debe haber al menos 1 sesión
        return this.proximasSesiones.length > 0 && 
               this.proximasSesiones.controls.every(ctrl => ctrl.valid);
      case 3:
        return !!this.tallerForm.get('politicaDeCancelacion.texto')?.valid &&
          !!this.tallerForm.get('datosDeContacto.texto')?.valid;
      default:
        return false;
    }
  }


}
