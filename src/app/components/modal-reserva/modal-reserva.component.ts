import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Paquete, HorarioSlot, DatosPaciente, SesionSeleccionada } from '../../interfaces/paquetes.interface';
import { PaquetesService } from '../../services/paquetes.service';
import { WebpayService } from '../../services/webpay.service';
import { CalendarioSemanalComponent } from './calendario-semanal.component';

@Component({
  selector: 'app-modal-reserva',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarioSemanalComponent],
  templateUrl: './modal-reserva.component.html',
  styleUrls: ['./modal-reserva.component.css']
})
export class ModalReservaComponent implements OnInit {
  @Input() paquete: Paquete | null = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() reservaCompletada = new EventEmitter<any>();

  // Control del modal
  paso: 1 | 2 | 3 = 1;
  procesando = false;

  // Paso 1: Selección de sesiones (NUEVO: soporte múltiple)
  sesionesSeleccionadas: SesionSeleccionada[] = [];
  modoSeleccionSesion: number | null = null; // Qué sesión se está eligiendo ahora (null = ninguna)

  // Paso 2: Datos del paciente
  datosPaciente: DatosPaciente = {
    rut: '',
    nombre: '',
    email: '',
    telefono: '',
    notas: '',
    direccion: '',
    comuna: ''
  };

  // Paso 3: Pago
  metodoPago: 'webpay' | 'mercadopago' | 'klap' | 'prueba' | null = null;
  errorMessage = '';

  constructor(
    private paquetesService: PaquetesService,
    private webpayService: WebpayService
  ) {}

  ngOnInit() {
    // Inicializar sesiones vacías según el paquete
    if (this.paquete) {
      this.sesionesSeleccionadas = [];
      this.modoSeleccionSesion = null;
    }
  }

  // ==========================================
  // PASO 1: CALENDARIO - SELECCIÓN MÚLTIPLE MEJORADA
  // ==========================================

  // Activar modo de selección para una sesión específica
  activarSeleccionSesion(numeroSesion: number) {
    this.modoSeleccionSesion = numeroSesion;
    console.log('[MODAL] Modo selección activado para sesión', numeroSesion);
    
    // Scroll hacia el calendario después de un pequeño delay
    setTimeout(() => {
      const calendario = document.querySelector('app-calendario-semanal');
      if (calendario) {
        calendario.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  // Verificar si una sesión ya está seleccionada
  sesionEstaSeleccionada(numeroSesion: number): boolean {
    return this.sesionesSeleccionadas.some(s => s.numero === numeroSesion);
  }

  // Obtener sesión seleccionada
  obtenerSesion(numeroSesion: number): SesionSeleccionada | undefined {
    return this.sesionesSeleccionadas.find(s => s.numero === numeroSesion);
  }

  onSeleccionCalendario(seleccion: { fecha: string, horario: HorarioSlot }) {
    // Si no hay modo de selección activo, activar para la primera sesión disponible
    if (this.modoSeleccionSesion === null) {
      this.modoSeleccionSesion = this.obtenerProximaSesionDisponible();
    }

    if (this.modoSeleccionSesion === null) {
      alert('Ya seleccionaste todas las sesiones del paquete');
      return;
    }

    // VALIDAR: No permitir solapamiento de horarios
    const haySolapamiento = this.sesionesSeleccionadas.some(s => {
      // Omitir si es la misma sesión que estamos editando
      if (s.numero === this.modoSeleccionSesion) return false;
      
      // Solo verificar si es la misma fecha
      if (s.fecha !== seleccion.fecha) return false;
      
      // Convertir horas a minutos para comparar
      const [h1, m1] = seleccion.horario.inicio.split(':').map(Number);
      const [h2, m2] = seleccion.horario.fin.split(':').map(Number);
      const [h3, m3] = s.horario.inicio.split(':').map(Number);
      const [h4, m4] = s.horario.fin.split(':').map(Number);
      
      const inicioNuevo = h1 * 60 + m1;
      const finNuevo = h2 * 60 + m2;
      const inicioExistente = h3 * 60 + m3;
      const finExistente = h4 * 60 + m4;
      
      // Hay solapamiento si:
      // - El inicio de la nueva sesión está entre el inicio y fin de una existente
      // - El fin de la nueva sesión está entre el inicio y fin de una existente
      // - La nueva sesión contiene completamente a una existente
      return (inicioNuevo >= inicioExistente && inicioNuevo < finExistente) ||
             (finNuevo > inicioExistente && finNuevo <= finExistente) ||
             (inicioNuevo <= inicioExistente && finNuevo >= finExistente);
    });
    
    if (haySolapamiento) {
      alert('Este horario se solapa con otra sesión ya seleccionada. Por favor elige un horario diferente.');
      return;
    }

    console.log('[MODAL] Selección recibida para sesión', this.modoSeleccionSesion, ':', seleccion);
    
    // Agregar o actualizar la sesión
    const sesion: SesionSeleccionada = {
      numero: this.modoSeleccionSesion,
      fecha: seleccion.fecha,
      horario: seleccion.horario
    };
    
    const index = this.sesionesSeleccionadas.findIndex(s => s.numero === this.modoSeleccionSesion);
    if (index >= 0) {
      this.sesionesSeleccionadas[index] = sesion;
    } else {
      this.sesionesSeleccionadas.push(sesion);
    }

    // Desactivar modo de selección después de elegir
    this.modoSeleccionSesion = null;
    
    // UX MEJORADA: Si es paquete de 1 sesión, hacer scroll al botón de siguiente paso
    // Si es paquete de múltiples sesiones, scroll hacia arriba para ver las sesiones
    setTimeout(() => {
      if (this.paquete && this.paquete.sesiones === 1) {
        // Para paquetes de 1 sesión: scroll al botón de siguiente paso
        const botonSiguiente = document.querySelector('.btn-primary');
        if (botonSiguiente) {
          botonSiguiente.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        // Para paquetes múltiples: scroll hacia arriba para ver sesiones
        const selectorSesiones = document.querySelector('.sesiones-selector');
        if (selectorSesiones) {
          selectorSesiones.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
    
    console.log('[MODAL] Sesiones seleccionadas:', this.sesionesSeleccionadas);
  }

  // Obtener próxima sesión disponible para seleccionar
  obtenerProximaSesionDisponible(): number | null {
    if (!this.paquete) return null;
    
    for (let i = 1; i <= this.paquete.sesiones; i++) {
      if (!this.sesionEstaSeleccionada(i)) {
        return i;
      }
    }
    return null;
  }

  // Desmarcar/eliminar una sesión
  desmarcarSesion(numeroSesion: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    const index = this.sesionesSeleccionadas.findIndex(s => s.numero === numeroSesion);
    if (index >= 0) {
      this.sesionesSeleccionadas.splice(index, 1);
    }
    
    // Si estaba en modo selección de esta sesión, cancelar
    if (this.modoSeleccionSesion === numeroSesion) {
      this.modoSeleccionSesion = null;
    }
  }

  continuarAPaso2() {
    if (!this.paquete) return;
    
    // Validar que se hayan seleccionado todas las sesiones
    if (this.sesionesSeleccionadas.length !== this.paquete.sesiones) {
      alert(`Por favor selecciona las ${this.paquete.sesiones} sesiones del paquete`);
      return;
    }
    
    // Ordenar sesiones por número antes de continuar
    this.sesionesSeleccionadas.sort((a, b) => a.numero - b.numero);
    
    this.paso = 2;
  }

  // ==========================================
  // PASO 2: DATOS DEL PACIENTE
  // ==========================================

  validarRUT(rut: string): boolean {
    // Eliminar puntos y guión
    rut = rut.replace(/\./g, '').replace(/-/g, '');
    
    if (rut.length < 2) return false;
    
    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1).toUpperCase();
    
    // Calcular dígito verificador
    let suma = 0;
    let multiplo = 2;
    
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo[i]) * multiplo;
      multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    
    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
    
    return dv === dvCalculado;
  }

  formatearRUT() {
    let rut = this.datosPaciente.rut.replace(/\./g, '').replace(/-/g, '');
    
    if (rut.length > 1) {
      const cuerpo = rut.slice(0, -1);
      const dv = rut.slice(-1);
      
      // Formatear con puntos
      const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      this.datosPaciente.rut = `${cuerpoFormateado}-${dv}`;
    }
  }

  continuarAPaso3() {
    // Validar campos requeridos
    if (!this.datosPaciente.rut || !this.datosPaciente.nombre || 
        !this.datosPaciente.email || !this.datosPaciente.telefono) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar RUT
    if (!this.validarRUT(this.datosPaciente.rut)) {
      alert('RUT inválido');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.datosPaciente.email)) {
      alert('Email inválido');
      return;
    }

    this.paso = 3;
  }

  // ==========================================
  // PASO 3: PAGO Y CONFIRMACIÓN
  // ==========================================

  seleccionarMetodoPago(metodo: 'webpay' | 'mercadopago' | 'klap' | 'prueba') {
    // Bloquear pago de prueba en producción
    if (metodo === 'prueba') {
      console.warn('[SECURITY] Intento de usar pago de prueba bloqueado');
      return;
    }
    this.metodoPago = metodo;
  }

  confirmarReserva() {
    if (!this.metodoPago) {
      alert('Por favor selecciona un método de pago');
      return;
    }

    if (!this.paquete || this.sesionesSeleccionadas.length === 0) {
      alert('Datos incompletos');
      return;
    }

    // Si es pago de prueba, procesar sin cargo
    if (this.metodoPago === 'prueba') {
      this.procesarPagoPrueba();
      return;
    }

    // Si es Webpay, procesar con integración real
    if (this.metodoPago === 'webpay') {
      this.procesarPagoWebpay();
      return;
    }

    // TODO: Implementar MercadoPago y Klap
    if (this.metodoPago === 'mercadopago' || this.metodoPago === 'klap') {
      alert(`Integración de ${this.metodoPago} en desarrollo`);
      return;
    }
  }

  /**
   * Procesa el pago con Webpay (Transbank)
   */
  procesarPagoWebpay() {
    if (!this.paquete) return;

    this.procesando = true;
    this.errorMessage = '';

    const transaccionData = {
      paqueteId: this.paquete.id,
      sesiones: this.sesionesSeleccionadas.map(s => ({
        fecha: s.fecha,
        horaInicio: s.horario.inicio,
        horaFin: s.horario.fin
      })),
      rutPaciente: this.datosPaciente.rut,
      nombrePaciente: this.datosPaciente.nombre,
      emailPaciente: this.datosPaciente.email,
      telefonoPaciente: this.datosPaciente.telefono,
      notas: this.datosPaciente.notas,
      direccion: this.datosPaciente.direccion,
      comuna: this.datosPaciente.comuna,
      modalidad: this.paquete.modalidad === 'ambas' ? 'online' : this.paquete.modalidad,
      monto: this.paquete.precio_nacional
    };

    console.log('[MODAL-RESERVA] Iniciando pago con Webpay:', transaccionData);

    this.webpayService.initTransaction(transaccionData)
      .subscribe({
        next: (response) => {
          this.procesando = false;
          
          if (response.success && response.url && response.token) {
            console.log('[MODAL-RESERVA] Transacción iniciada, redirigiendo a Webpay...');
            console.log('   Token:', response.token);
            console.log('   URL:', response.url);
            
            // Guardar información en localStorage para tracking (opcional)
            localStorage.setItem('webpay_buy_order', response.buyOrder);
            localStorage.setItem('webpay_timestamp', new Date().toISOString());
            
            // Redirigir a Webpay
            window.location.href = response.url + '?token_ws=' + response.token;
          } else {
            this.errorMessage = response.message || 'Error al iniciar transacción';
            alert('Error al procesar el pago: ' + this.errorMessage);
          }
        },
        error: (err) => {
          this.procesando = false;
          this.errorMessage = err.error?.error || 'Error al conectar con Webpay';
          console.error('[MODAL-RESERVA] Error:', err);
          alert('Error al procesar el pago: ' + this.errorMessage);
        }
      });
  }

  procesarPagoPrueba() {
    // Método deshabilitado - no se permite pago de prueba
    console.error('[SECURITY] Intento de procesar pago de prueba bloqueado');
    alert('⛔ Esta funcionalidad no está disponible');
    this.procesando = false;
    return;
  }
      notas: this.datosPaciente.notas,
      direccion: this.datosPaciente.direccion,
      comuna: this.datosPaciente.comuna,
      modalidad: this.paquete.modalidad === 'ambas' ? 'online' : this.paquete.modalidad,
      metodoPago: 'prueba',
      monto: 0, // Sin cargo
      esPrueba: true // Flag para indicar que es prueba
    };

    console.log('[PAGO-PRUEBA] Procesando reserva de prueba:', reservaData);

    this.paquetesService.reservarConPaquete(reservaData)
      .subscribe({
        next: (response) => {
          this.procesando = false;
          if (response.success) {
            alert(
              '✅ RESERVA DE PRUEBA CREADA\n\n' +
              'Las citas se han creado en el sistema sin cargo.\n' +
              'Recibirás un email con los detalles.'
            );
            this.reservaCompletada.emit(response);
            this.cerrarModal();
          } else {
            this.errorMessage = response.message || 'Error al procesar la reserva';
          }
        },
        error: (err) => {
          this.procesando = false;
          this.errorMessage = err.error?.error || 'Error al procesar la reserva';
          console.error('[PAGO-PRUEBA] Error:', err);
          alert('Error al crear la reserva de prueba: ' + this.errorMessage);
        }
      });
  }

  // ==========================================
  // HELPERS
  // ==========================================

  obtenerIconoEstadoSesion(numeroSesion: number): 'vacio' | 'activo' | 'completado' {
    if (this.modoSeleccionSesion === numeroSesion) return 'activo';
    if (this.sesionEstaSeleccionada(numeroSesion)) return 'completado';
    return 'vacio';
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dias[date.getDay()]} ${date.getDate()} ${meses[date.getMonth()]}`;
  }

  // ==========================================
  // NAVEGACIÓN Y CONTROL
  // ==========================================

  volverPaso() {
    if (this.paso > 1) {
      this.paso = (this.paso - 1) as 1 | 2 | 3;
    }
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}
