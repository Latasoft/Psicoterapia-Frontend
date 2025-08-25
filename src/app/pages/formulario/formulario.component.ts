import { Component, OnInit } from '@angular/core';
import { CitasService } from '../../services/citas.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
declare function gtag(command: string, eventName: string, params: any): void;

@Component({
  selector: 'app-formulario',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './formulario.component.html',
  styleUrls: ['./formulario.component.css']
})
export class FormularioComponent implements OnInit {

  nombre = '';
  correo = '';
  fecha = '';
  hora = '';
  tratamiento = '';
  step = 1;
  errorMessage = '';
  horasDisponibles: string[] = [];
  fechaMinima = '';
  tratamientosDisponibles: any[] = [];


  precio: { nacional: number | null; internacional: number | null; sesiones: number | null } = {
    nacional: null,
    internacional: null,
    sesiones: null
  };

  

  tratamientosConPrecios: {
    [k: string]: {
      nacional: number;
      internacional: number;
      sesiones: number;
     
      linkPagoWebpay?: string;
      linkPagoMercadoPago?: string;
    };
  } = {
    'Taller de duelo': {
      nacional: 70000,
      internacional: 80,
      sesiones: 4,
   
      linkPagoWebpay: 'https://www.webpay.cl/form-pay/264721',
      linkPagoMercadoPago:
        'https://www.mercadopago.cl/checkout/v1/payment/redirect/5d55fad7-d8ae-49ab-9c75-94b8a1e85c98/payment-option-form-v2/?source=link&preference-id=85259864-b4065e2e-8790-4880-bd92-e2a79c7e1fb8&router-request-id=db34fe17-4ff6-4f9e-ac22-9ed957fc94fe&p=a12b801301ff2068de1e0d88a18188ca'
    },
    'Psicoterapia e hipnoterapia': {
      nacional: 40000,
      internacional: 50,
      sesiones: 1,
    
      linkPagoWebpay: 'https://www.webpay.cl/form-pay/264721',
      linkPagoMercadoPago:
        'https://www.mercadopago.cl/checkout/v1/payment/redirect/f84c9bd0-1915-4e2b-aae1-298a700bd841/payment-option-form-v2/?source=link&preference-id=85259864-f26303ab-6b6d-4660-b199-4ecfb5b8d265&router-request-id=86e17d1d-1f8c-43a3-8382-0ef48a568e72&p=a12b801301ff2068de1e0d88a18188ca'
    }
  };

  constructor(
    private citasService: CitasService,
    private router: Router           // ⬅️  Router inyectado
  ) {}

  ngOnInit(): void {
  this.fechaMinima = new Date().toISOString().slice(0, 10);

  this.citasService.obtenerTratamientos().subscribe({
    next: (tratamientos) => {
      this.tratamientosDisponibles = tratamientos;
    },
    error: (err) => {
      console.error('Error al obtener tratamientos:', err);
    }
  });
}


  actualizarPrecio(): void {
  const t = this.tratamientosDisponibles.find(t => t.nombre === this.tratamiento);
  this.precio = t
    ? {
        nacional: t.precioNacional,
        internacional: t.precioInternacional,
        sesiones: t.sesiones
      }
    : { nacional: null, internacional: null, sesiones: null };
}


  validarFecha(): void {
  const d = new Date(this.fecha);
  const fechaISO = d.toISOString().slice(0, 10);


  this.errorMessage = '';

  this.citasService.obtenerHorariosDisponibles(fechaISO).subscribe({
    next: (data) => {
      this.horasDisponibles = data.horariosDisponibles || [];
      if (!this.horasDisponibles.includes(this.hora)) {
        this.hora = ''; // Limpiar hora si no es válida
      }
    },
    error: (err) => {
      console.error('Error al obtener horarios:', err);
      this.errorMessage = 'Ocurrió un error al consultar los horarios.';
      this.horasDisponibles = [];
    }
  });
}

  

  esHorarioValido(): boolean {
    if (!this.fecha || !this.hora) {
      this.errorMessage = 'Debe seleccionar fecha y hora.';
      return false;
    }
   
    if (!this.horasDisponibles.includes(this.hora)) {
      this.errorMessage = 'La hora seleccionada no está disponible.';
      return false;
    }
    this.errorMessage = '';
    return true;
  }

  goToStep(step: number): void {
    this.step = step;
  }

  private crearCita() {
    return {
      nombre: this.nombre,
      correo: this.correo,
      fecha_hora: `${this.fecha}T${this.hora}:00`,
      tratamiento: this.tratamiento
    };
  }

  onSubmit(pago: 'webpay' | 'mercadopago' = 'webpay'): void {
  if (!this.esHorarioValido()) return;

  const cita = this.crearCita();

  this.citasService.reservarCita(cita).subscribe(
    () => {
      const links = this.tratamientosConPrecios[this.tratamiento];
      const url = pago === 'mercadopago'
        ? links.linkPagoMercadoPago!
        : links.linkPagoWebpay!;

      // 👉 Evento de conversión de Google Ads
      gtag('event', 'conversion', {
        'send_to': 'AW-17061582156/Shn0CPDd6cMaEMyqzMc_',
        'value': 1.0,
        'currency': 'CLP'
      });

      // 👉 Redirección al link de pago
      window.location.href = url;
    },
    err => console.error('Error al reservar cita:', err)
  );
}


  /** Guarda la cita y redirige a /pago-klap */
  irAPagoKlap(): void {
    if (!this.esHorarioValido()) return;

    const cita = this.crearCita();

    this.citasService.reservarCita(cita).subscribe(
      () => this.router.navigate(['/pago-klap']),
      err => console.error('Error al reservar cita:', err)
    );
  }
}
