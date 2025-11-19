import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service';
import { PageContentService } from '../../services/page-content.service';
import { CitasService } from '../../services/citas.service';
import { WebpayService } from '../../services/webpay.service';

interface Precio {
  nacional: number | null;
  internacional: number | null;
  sesiones: number | null;
}

interface Tratamiento {
  id: string;
  nombre: string;
  precioNacional: number;
  precioInternacional: number;
  sesiones: number;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  src: string;
  alt?: string;
  section: string;
  publicId?: string;
}

@Component({
  selector: 'app-formulario',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './formulario.component.html',
  styleUrls: ['./formulario.component.css', './formulario-extended.component.css']
})
export class FormularioComponent implements OnInit, OnDestroy {
  // Admin properties
  isLoggedIn = false;
  adminMode = false;
  bannerImage = 'assets/a2.avif';
  uploadingMedia = false;
  selectedFile: File | null = null;

  // Content properties
  aboutContent = {
    title: 'Sobre mí',
    description: '22 años de experiencia profesional en el área clínica, educacional y en relatorías avalan mi trabajo. Especialista en Hipnoterapia para trabajar estados depresivos, ansiosos, de angustia, duelos y crisis vitales.'
  };

  cards = [
    {
      title: 'Confidencialidad',
      description: 'Todo lo compartido en las sesiones se mantiene en total confidencialidad, garantizando un espacio seguro para tu desarrollo personal.'
    },
    {
      title: 'Profesionalismo',
      description: 'Cuento con la formación y experiencia necesarias para ofrecer un servicio de calidad, basado en el respeto y la ética profesional.'
    },
    {
      title: 'Responsabilidad',
      description: 'Me comprometo a ofrecerte la mejor atención, siguiendo los estándares más altos de profesionalismo y dedicación.'
    }
  ];

  // Form properties
  step = 1;
  totalSteps = 3;

  // Form fields - Datos del paciente
  nombre = '';
  correo = '';
  telefono = '';
  
  // Datos de la cita
  tratamiento = '';
  fecha: string = '';
  hora: string = '';
  notasCita = '';

  // Treatment and pricing
  tratamientosDisponibles: Tratamiento[] = [];
  precio: Precio = {
    nacional: null,
    internacional: null,
    sesiones: null
  };

  // Date and time handling
  fechaMinima: string = new Date().toISOString().split('T')[0];
  horasDisponibles: string[] = [];
  errorMessage = '';

  // Payment processing
  procesandoPago = false;

  // Debounce timeout
  private saveTimeout: any;

  // Nuevas propiedades para Webpay manual
  mostrarFormularioWebpay = false;

  // Propiedades para el popup de Webpay
  mostrarPopupWebpay = false;

  // Propiedades para MercadoPago (igual que Webpay)
  mostrarFormularioMercadoPago = false;
  mostrarPopupMercadoPago = false;

  // Propiedades para KLAP (igual que Webpay y MercadoPago)
  mostrarFormularioKlap = false;
  mostrarPopupKlap = false;

  constructor(
    private authService: AuthService,
    private imageService: ImageService,
    private pageContentService: PageContentService,
    private citasService: CitasService,
    private webpayService: WebpayService,
    private router: Router
  ) {}

  // ========== CACHE DEL FORMULARIO ==========
  private readonly FORM_CACHE_KEY = 'formulario_cliente_datos';

  private saveFormDataToCache() {
    const formData = {
      nombre: this.nombre,
      correo: this.correo,
      telefono: this.telefono,
      tratamiento: this.tratamiento,
      fecha: this.fecha,
      hora: this.hora,
      step: this.step,
      timestamp: new Date().getTime()
    };
    
    localStorage.setItem(this.FORM_CACHE_KEY, JSON.stringify(formData));
    console.log('Datos del formulario guardados en caché:', formData);
  }

  private loadFormDataFromCache() {
    try {
      const cachedData = localStorage.getItem(this.FORM_CACHE_KEY);
      if (cachedData) {
        const formData = JSON.parse(cachedData);
        
        // Verificar que los datos no sean muy antiguos (24 horas)
        const now = new Date().getTime();
        const cacheAge = now - formData.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
        
        if (cacheAge < maxAge) {
          this.nombre = formData.nombre || '';
          this.correo = formData.correo || '';
          this.telefono = formData.telefono || '';
          this.tratamiento = formData.tratamiento || '';
          this.fecha = formData.fecha || '';
          this.hora = formData.hora || '';
          this.step = formData.step || 1;
          
          console.log('Datos del formulario cargados desde caché:', formData);
          return true;
        } else {
          console.log('Datos del caché expirados, eliminando...');
          this.clearFormCache();
        }
      }
    } catch (error) {
      console.error('Error al cargar datos del caché:', error);
      this.clearFormCache();
    }
    return false;
  }

  clearFormCache() {
    localStorage.removeItem(this.FORM_CACHE_KEY);
    console.log('Caché del formulario eliminado');
    
    // Limpiar los datos del formulario actual
    this.nombre = '';
    this.correo = '';
    this.telefono = '';
    this.tratamiento = '';
    this.fecha = '';
    this.hora = '';
    this.notasCita = '';
    this.step = 1;
    
    alert('Datos guardados eliminados correctamente');
  }

  debouncedSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveFormDataToCache();
    }, 1000); // Guardar después de 1 segundo de inactividad
  }

  ngOnInit() {
    // Cargar datos del caché antes de inicializar
    this.loadFormDataFromCache();
    this.initializeComponent();
  }

  ngOnDestroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }

  // ========== INITIALIZATION ==========
  private async initializeComponent() {
    const loggedIn = this.authService.isLoggedIn();
    this.isLoggedIn = loggedIn;
    
    if (loggedIn) {
      await this.loadPageContent();
    }
    
    await this.cargarTratamientos();
  }

  // ========== TRATAMIENTOS ==========
  async cargarTratamientos() {
    try {
      const tratamientos = await lastValueFrom(this.citasService.obtenerTratamientos());
      this.tratamientosDisponibles = tratamientos;
      console.log('Tratamientos cargados:', this.tratamientosDisponibles);
    } catch (error) {
      console.error('Error al cargar tratamientos:', error);
      this.tratamientosDisponibles = [];
    }
  }

  actualizarPrecio() {
    const tratamientoSeleccionado = this.tratamientosDisponibles.find(
      t => t.nombre === this.tratamiento
    );
    
    if (tratamientoSeleccionado) {
      this.precio = {
        nacional: tratamientoSeleccionado.precioNacional,
        internacional: tratamientoSeleccionado.precioInternacional,
        sesiones: tratamientoSeleccionado.sesiones
      };
    } else {
      this.precio = {
        nacional: null,
        internacional: null,
        sesiones: null
      };
    }
  }

  // ========== FECHA Y HORARIOS ==========
  async validarFecha() {
    this.errorMessage = '';
    this.horasDisponibles = [];

    if (!this.fecha) {
      return;
    }

    const fechaSeleccionada = new Date(this.fecha + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      this.errorMessage = 'No se puede seleccionar una fecha pasada';
      return;
    }

    if (fechaSeleccionada.getDay() === 0) {
      this.errorMessage = 'No se atiende los domingos';
      return;
    }

    await this.cargarHorariosDisponibles();
  }

  async cargarHorariosDisponibles() {
    try {
      console.log('Cargando horarios para fecha:', this.fecha);
      
      const response = await lastValueFrom(
        this.citasService.obtenerHorariosDisponibles(this.fecha)
      );
      
      console.log('Respuesta horarios completa:', response);
      
      if (response && response.horariosDisponibles) {
        const horariosRaw = response.horariosDisponibles;
        
        // Procesar según estructura recibida
        if (horariosRaw.length > 0) {
          if (typeof horariosRaw[0] === 'object') {
            if (horariosRaw[0].display) {
              // Estructura con display
              this.horasDisponibles = horariosRaw.map((h: any) => h.display);
            } else if (horariosRaw[0].inicio && horariosRaw[0].fin) {
              // Estructura con inicio/fin
              this.horasDisponibles = horariosRaw.map((h: any) => `${h.inicio} - ${h.fin}`);
            }
          } else {
            // Array de strings
            this.horasDisponibles = horariosRaw;
          }
          
          // ✅ NUEVO: Mostrar información sobre horas ocupadas si está disponible
          if (response.horasOcupadas && response.horasOcupadas.length > 0) {
            console.log(`Se encontraron ${response.horasOcupadas.length} horas ocupadas:`, response.horasOcupadas);
          }
          
          // ✅ NUEVO: Si la hora actualmente seleccionada ya no está disponible, limpiarla
          if (this.hora && !this.horasDisponibles.includes(this.hora)) {
            console.log(`La hora seleccionada '${this.hora}' ya no está disponible. Limpiando selección.`);
            this.hora = '';
            this.errorMessage = 'La hora que tenías seleccionada ya no está disponible. Por favor selecciona otra.';
          }
        } else {
          this.horasDisponibles = [];
          this.errorMessage = 'No hay horarios disponibles para esta fecha.';
        }
      } else {
        this.horasDisponibles = [];
        this.errorMessage = 'No se pudieron cargar los horarios disponibles.';
      }
      
      console.log('Horarios procesados:', this.horasDisponibles);
      
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      this.horasDisponibles = [];
      this.errorMessage = 'Error al cargar horarios disponibles';
    }
  }

  // ========== VALIDACIONES ==========
  esFormularioValido(): boolean {
    return this.nombre.trim() !== '' && 
           this.correo.trim() !== '' &&
           this.telefono.trim() !== '' &&
           this.tratamiento !== '' && 
           this.esHorarioValido();
  }
  
  esHorarioValido(): boolean {
    const horarioBasicoValido = this.fecha !== '' && 
                                this.hora !== '' && 
                                this.horasDisponibles.includes(this.hora);
    
    // ✅ NUEVO: Validación adicional para asegurar que la hora sigue disponible
    if (horarioBasicoValido && this.horasDisponibles.length > 0) {
      // Si la hora seleccionada no está en la lista actual de horas disponibles,
      // significa que fue ocupada por otra reserva
      if (!this.horasDisponibles.includes(this.hora)) {
        console.warn(`La hora '${this.hora}' ya no está disponible`);
        this.errorMessage = 'La hora seleccionada ya no está disponible. Por favor selecciona otra.';
        this.hora = ''; // Limpiar la selección
        return false;
      }
    }
    
    return horarioBasicoValido;
  }

  esMercadoPagoDisponible(): boolean {
    return this.precio.nacional === 40000 || this.precio.nacional === 70000;
  }

  esPasoValido(paso: number): boolean {
    switch (paso) {
      case 1:
        return this.nombre.trim() !== '' && 
               this.correo.trim() !== '' &&
               this.telefono.trim() !== '' &&
               this.tratamiento !== '';
      case 2:
        return this.esHorarioValido();
      case 3:
        return this.esFormularioValido();
      default:
        return false;
    }
  }

  // ========== NAVEGACION ==========
  goToStep(stepNumber: number) {
    if (stepNumber <= this.totalSteps && stepNumber >= 1) {
      this.step = stepNumber;
    }
  }

  siguientePaso() {
    if (this.step < this.totalSteps && this.esPasoValido(this.step)) {
      this.step++;
      this.debouncedSave(); // Guardar datos al cambiar de paso
    }
  }

  pasoAnterior() {
    if (this.step > 1) {
      this.step--;
      this.debouncedSave(); // Guardar datos al cambiar de paso
    }
  }

  // ========== PAGOS ==========
  // Enviar formulario con integración de pagos
  async onSubmit(paymentMethod: string) {
    console.log('=== INICIANDO onSubmit ===');
    console.log('Método de pago seleccionado:', paymentMethod);
    
    // Validaciones detalladas
    if (!this.nombre || this.nombre.trim() === '') {
      alert('Por favor ingrese su nombre completo');
      return;
    }
    
    if (!this.correo || this.correo.trim() === '') {
      alert('Por favor ingrese su correo electrónico');
      return;
    }
    
    if (!this.validarEmail(this.correo.trim())) {
      alert('Por favor ingrese un correo electrónico válido');
      return;
    }
    
    if (!this.telefono || this.telefono.trim() === '') {
      alert('Por favor ingrese su teléfono de contacto');
      return;
    }
    
    if (!this.tratamiento) {
      alert('Por favor seleccione un tratamiento');
      return;
    }
    
    if (!this.fecha) {
      alert('Por favor seleccione una fecha');
      return;
    }
    
    if (!this.hora) {
      alert('Por favor seleccione una hora');
      return;
    }
    
    if (!this.esHorarioValido()) {
      alert('La hora seleccionada no está disponible');
      return;
    }

    // Validación específica para MercadoPago
    if (paymentMethod === 'mercadopago' && !this.esMercadoPagoDisponible()) {
      alert('MercadoPago solo está disponible para tratamientos de $40.000 y $70.000');
      return;
    }

    this.procesandoPago = true;

    try {
      console.log('=== DATOS DEL FORMULARIO ===');
      console.log('Nombre:', this.nombre);
      console.log('Correo:', this.correo);
      console.log('Tratamiento:', this.tratamiento);
      console.log('Fecha:', this.fecha);
      console.log('Hora:', this.hora);
      console.log('Precio:', this.precio);
      console.log('Horarios disponibles:', this.horasDisponibles);

      // Crear la cita primero
      const citaId = await this.crearCita();
      
      if (!citaId) {
        throw new Error('No se pudo crear la cita. Verifique los datos ingresados.');
      }

      console.log('Cita creada exitosamente con ID:', citaId);

      // Limpiar caché del formulario una vez que la cita se crea exitosamente
      this.clearFormCache();

      // Procesar pago según método
      switch (paymentMethod) {
        case 'webpay':
          console.log('Procesando pago con Webpay...');
          await this.procesarPagoWebpay(citaId);
          break;
        case 'mercadopago':
          console.log('Procesando pago con MercadoPago...');
          await this.procesarPagoMercadoPago(citaId);
          break;
        case 'klap':
          console.log('Redirigiendo a Klap...');
          this.irAPagoKlap();
          break;
        default:
          console.log('Cita sin pago procesada exitosamente');
          alert('¡Cita reservada exitosamente! Te llegará un correo de confirmación.');
          this.limpiarFormulario();
          break;
      }
      
    } catch (error) {
      console.error('=== ERROR EN onSubmit ===');
      console.error('Error completo:', error);
      console.error('Tipo de error:', typeof error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      
      let errorMessage = 'Error desconocido al procesar la solicitud.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.log('Error message from Error instance:', error.message);
      } else if (typeof error === 'string') {
        errorMessage = error;
        console.log('Error as string:', error);
      } else if (error && typeof error === 'object') {
        console.log('Error as object:', JSON.stringify(error, null, 2));
        const errObj = error as { error?: any; message?: string; status?: number };
        
        if (errObj.status === 0) {
          errorMessage = 'Error de conexión. Verifique su conexión a internet.';
        } else if (errObj.error && typeof errObj.error === 'object' && 'message' in errObj.error) {
          errorMessage = errObj.error.message;
        } else if (errObj.message) {
          errorMessage = errObj.message;
        } else if (errObj.error) {
          errorMessage = typeof errObj.error === 'string' ? errObj.error : JSON.stringify(errObj.error);
        }
      }
      
      console.error('Mensaje de error final:', errorMessage);
      alert(`Error: ${errorMessage}\n\nDetalles técnicos guardados en la consola.\nPor favor intenta nuevamente o contacta al administrador.`);
    } finally {
      this.procesandoPago = false;
      console.log('=== FIN onSubmit ===');
    }
  }

  private async crearCita(): Promise<string | null> {
    try {
      console.log('=== CREANDO CITA ===');
      
      // Extraer hora de inicio si viene en formato "HH:MM - HH:MM"
      let horaInicio = this.hora;
      if (this.hora.includes(' - ')) {
        horaInicio = this.hora.split(' - ')[0];
      }
      
      // Construir objeto patient con campos básicos
      const patientData: any = {
        full_name: this.nombre.trim(),
        email: this.correo.trim().toLowerCase(),
        phone: this.telefono.trim()
      };
      
      // Construir datos de la cita en el nuevo formato
      const citaData = {
        patient: patientData,
        treatment_id: this.tratamiento,
        fecha: this.fecha,
        hora: horaInicio,
        notas: this.notasCita && this.notasCita.trim() ? this.notasCita.trim() : undefined
      };

      console.log('Datos de la cita a enviar (nuevo formato):', citaData);
      
      const response = await lastValueFrom(this.citasService.reservarCita(citaData));
      
      console.log('Respuesta completa del servidor:', response);
      
      if (!response || !response.success) {
        throw new Error(response?.message || 'No se recibió respuesta del servidor.');
      }
      
      const citaId = response.cita?.id;
      if (!citaId) {
        throw new Error('No se recibió el ID de la cita.');
      }
      
      console.log('Cita creada exitosamente. ID:', citaId);
      console.log('Paciente ID:', response.paciente?.id);
      
      // Refrescar horarios disponibles
      if (this.fecha === new Date().toISOString().split('T')[0] || 
          new Date(this.fecha) >= new Date()) {
        console.log('Refrescando horarios disponibles...');
        await this.cargarHorariosDisponibles();
      }
      
      return citaId;
      
    } catch (error) {
      console.error('=== ERROR AL CREAR CITA ===');
      console.error('Error completo:', error);
      throw error;
    }
  }

  private validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async procesarPagoWebpay(citaId: string) {
    try {
      console.log('=== PROCESANDO PAGO WEBPAY ===');
      
      const monto = this.precio.nacional;
      
      if (!monto || monto <= 0) {
        throw new Error('El monto del tratamiento no es válido');
      }
      
      const buyOrder = `CITA-${citaId}-${Date.now()}`;
      const sessionId = `SESSION-${Date.now()}`;
      
      // Usar localhost para desarrollo
      const baseUrl = window.location.origin; // Esto será http://localhost:4200
      const returnUrl = `${baseUrl}/webpay-return`;

      const transactionData = {
        buyOrder,
        sessionId,
        amount: monto,
        returnUrl
      };

      console.log('Datos de transacción Webpay:', transactionData);
      console.log('URL de retorno:', returnUrl);

      const response = await lastValueFrom(
        this.webpayService.createTransaction(transactionData)
      );

      console.log('Respuesta de Webpay:', response);

      if (!response || !response.token || !response.url) {
        throw new Error('Respuesta inválida de Webpay. Faltan token o URL.');
      }

      // Guardar datos en localStorage
      const transactionInfo = {
        token: response.token,
        citaId,
        buyOrder,
        sessionId,
        amount: monto,
        tratamiento: this.tratamiento,
        fecha: this.fecha,
        hora: this.hora,
        nombre: this.nombre,
        correo: this.correo
      };
      
      localStorage.setItem('webpay_transaction', JSON.stringify(transactionInfo));
      console.log('Datos guardados en localStorage:', transactionInfo);

      // Redirigir a Webpay
      const webpayUrl = `${response.url}?token_ws=${response.token}`;
      console.log('Redirigiendo a Webpay URL:', webpayUrl);
      
      window.location.href = webpayUrl;

    } catch (error) {
      console.error('Error detallado en procesarPagoWebpay:', error);
      
      if (error instanceof Error) {
        throw new Error(`Error en Webpay: ${error.message}`);
      } else {
        throw new Error('Error desconocido al procesar pago con Webpay');
      }
    }
  }

  private async procesarPagoMercadoPago(citaId: string) {
    try {
      console.log('=== PROCESANDO PAGO MERCADOPAGO ===');
      console.log('Procesando pago MercadoPago para cita:', citaId);
      console.log('Monto del tratamiento:', this.precio.nacional);
      
      const monto = this.precio.nacional;
      
      if (!monto) {
        throw new Error('No se pudo determinar el monto del tratamiento');
      }
      
      let mercadoPagoUrl = '';
      
      // Determinar URL según el monto
      if (monto === 40000) {
        mercadoPagoUrl = 'https://mpago.la/1cJ4Rht';
      } else if (monto === 70000) {
        mercadoPagoUrl = 'https://mpago.la/1BPFfVT';
      } else {
        throw new Error(`MercadoPago solo está disponible para montos de $40.000 y $70.000. Monto actual: $${monto.toLocaleString()}`);
      }
      
      // Guardar datos en localStorage (igual que Webpay)
      const transactionInfo = {
        mercadoPagoUrl,
        citaId,
        amount: monto,
        tratamiento: this.tratamiento,
        fecha: this.fecha,
        hora: this.hora,
        nombre: this.nombre,
        correo: this.correo,
        metodoPago: 'MercadoPago'
      };
      
      localStorage.setItem('mercadopago_transaction', JSON.stringify(transactionInfo));
      console.log('Datos guardados en localStorage para MercadoPago:', transactionInfo);
      
      console.log('Redirigiendo a MercadoPago URL:', mercadoPagoUrl);
      
      // Mostrar vista de procesamiento y luego redirigir (igual que Webpay)
      window.location.href = mercadoPagoUrl;
      
    } catch (error) {
      console.error('Error en procesarPagoMercadoPago:', error);
      
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Error al procesar el pago con MercadoPago');
      }
    }
  }

  irAPagoKlap() {
    this.router.navigate(['/pago-klap'], {
      queryParams: {
        monto: this.precio.nacional,
        tratamiento: this.tratamiento,
        fecha: this.fecha,
        hora: this.hora,
        nombre: this.nombre,
        correo: this.correo
      }
    });
  }

  mostrarWebpay() {
    this.mostrarFormularioWebpay = true;
  }

  cancelarPago() {
    this.mostrarFormularioWebpay = false;
  }

  // Funciones para MercadoPago (iguales que Webpay)
  mostrarMercadoPago() {
    this.mostrarFormularioMercadoPago = true;
  }

  cancelarPagoMercadoPago() {
    this.mostrarFormularioMercadoPago = false;
  }

  abrirMercadoPago(url: string) {
    console.log('Abriendo MercadoPago en:', url);
    window.open(url, '_blank');
  }

  // Funciones para KLAP (iguales que Webpay y MercadoPago)
  mostrarKlap() {
    this.mostrarFormularioKlap = true;
  }

  cancelarPagoKlap() {
    this.mostrarFormularioKlap = false;
  }

  abrirPopupWebpay() {
    this.mostrarPopupWebpay = true;
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
  }

  cerrarPopupWebpay() {
    this.mostrarPopupWebpay = false;
    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
  }

  async confirmarPagoManual() {
    try {
      // Cerrar el popup primero
      this.cerrarPopupWebpay();
      
      // Mostrar indicador de procesamiento
      this.procesandoPago = true;

      // Crear datos de la cita con información de pago
      const citaData = {
        nombre: this.nombre,
        correo: this.correo,
        tratamiento: this.tratamiento,
        fecha: this.fecha,
        hora: this.hora,
        monto: this.precio.nacional,
        estadoPago: 'pendiente_confirmacion',
        metodoPago: 'webpay_manual',
        fechaPago: new Date().toISOString()
      };

      // Enviar la cita (puedes usar tu servicio existente)
      const response = await this.crearCitaConPago(citaData);
      
      // Enviar notificación a Matías sobre el pago confirmado
      try {
        const notificationData = {
          nombre: citaData.nombre,
          correo: citaData.correo,
          tratamiento: citaData.tratamiento,
          fecha: citaData.fecha,
          hora: citaData.hora,
          precio: citaData.monto
        };
        
        console.log('Enviando notificación de pago confirmado a Matías...');
        await lastValueFrom(this.citasService.notificarReservacion(notificationData));
        console.log('Notificación de pago confirmado enviada a Matías');
      } catch (notificationError) {
        console.error('Error al enviar notificación de pago confirmado:', notificationError);
      }
      
      // Mostrar confirmación exitosa
      this.mostrarConfirmacionExitosa();
      
      // Limpiar formulario
      this.limpiarFormulario();
      
    } catch (error) {
      console.error('Error al confirmar pago:', error);
      alert('Error al procesar la confirmación. Por favor contacta al administrador.');
    } finally {
      this.procesandoPago = false;
    }
  }

  private async crearCitaConPago(citaData: any) {
    try {
      // Extraer hora de inicio si viene en formato "HH:MM - HH:MM"
      let horaInicio = citaData.hora;
      if (citaData.hora.includes(' - ')) {
        horaInicio = citaData.hora.split(' - ')[0];
      }
      
      const fechaHora = `${citaData.fecha}T${horaInicio}:00`;
      
      // ✅ Enviar solo los campos que acepta el backend actual
      const citaParaEnviar = {
        nombre: citaData.nombre.trim(),
        correo: citaData.correo.trim().toLowerCase(),
        fecha_hora: fechaHora,
        tratamiento: citaData.tratamiento
        // ❌ Remover estos campos por ahora:
        // monto: citaData.monto,
        // estado_pago: citaData.estadoPago,
        // metodo_pago: citaData.metodoPago,
        // fecha_pago: citaData.fechaPago
      };

      console.log('Creando cita con pago:', citaParaEnviar);
      
      const response = await lastValueFrom(this.citasService.reservarCita(citaParaEnviar));
      
      console.log('Correo llegó bien');
      return response;
      
    } catch (error) {
      console.error('Error al crear cita con pago:', error);
      throw error;
    }
  }

  private mostrarConfirmacionExitosa() {
    const mensaje = `
    🎉 ¡Pago confirmado exitosamente!
    
    📧 Detalles enviados a: ${this.correo}
    📅 Fecha de cita: ${this.fecha}
    ⏰ Hora: ${this.hora}
    💰 Monto: $${this.precio.nacional}
    🏥 Tratamiento: ${this.tratamiento}
    
    ✅ El administrador verificará tu pago y te contactará pronto.
    
    ¡Gracias por confiar en nosotros!
    `;
    
    alert(mensaje);
  }

  // Cerrar popup con tecla Escape
  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.mostrarPopupWebpay) {
      this.cerrarPopupWebpay();
    }
  }

  // ========== UTILIDADES ==========
  limpiarFormulario() {
    this.step = 1;
    this.tratamiento = '';
    this.nombre = '';
    this.correo = '';
    this.fecha = '';
    this.hora = '';
    this.horasDisponibles = [];
    this.precio = { nacional: null, internacional: null, sesiones: null };
    this.errorMessage = '';
  }

  // ========== ADMIN FUNCTIONS ==========
  toggleAdminMode() {
    this.adminMode = !this.adminMode;
  }

  onImageClick(type: string) {
    if (!this.adminMode) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        this.uploadFile(type);
      }
    };
    input.click();
  }

  async uploadFile(mediaKey: string) {
    if (!this.selectedFile) return;
    
    try {
      this.uploadingMedia = true;
      
      const uploadResponse = await lastValueFrom(
        this.imageService.uploadImage(this.selectedFile, 'formulario')
      );
      
      if (uploadResponse && uploadResponse.secure_url) {
        const mediaItem: MediaItem = {
          id: mediaKey,
          type: 'image',
          src: uploadResponse.secure_url,
          alt: 'Imagen formulario',
          section: 'formulario',
          publicId: uploadResponse.public_id
        };
        
        if (mediaKey === 'banner') {
          this.bannerImage = uploadResponse.secure_url;
          this.saveMediaToStorage(mediaItem);
          await this.saveContentChanges();
        }
      }
    } catch (error) {
      console.error('Error al subir archivo:', error);
    } finally {
      this.uploadingMedia = false;
      this.selectedFile = null;
    }
  }

  saveMediaToStorage(mediaItem: MediaItem) {
    let storedMedia = localStorage.getItem('mediaItems');
    let mediaItems: MediaItem[] = storedMedia ? JSON.parse(storedMedia) : [];
    
    const existingIndex = mediaItems.findIndex(item => item.id === mediaItem.id);
    if (existingIndex >= 0) {
      mediaItems[existingIndex] = mediaItem;
    } else {
      mediaItems.push(mediaItem);
    }
    
    localStorage.setItem('mediaItems', JSON.stringify(mediaItems));
  }

  private async saveContentChanges() {
    if (!this.adminMode) return;

    const content = {
      bannerImage: this.bannerImage,
      aboutContent: this.aboutContent,
      cards: this.cards
    };

    try {
      await lastValueFrom(
        this.pageContentService.updatePageContent('formulario', content)
      );
      console.log('Contenido actualizado exitosamente');
    } catch (err) {
      console.error('Error al actualizar contenido:', err);
    }
  }

  onContentChange() {
    if (!this.adminMode) return;
    
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveContentChanges();
    }, 1000);
  }

  onTextChange(event: any, field: string) {
    if (!this.adminMode) return;
    
    if (field === 'description') {
      this.aboutContent.description = event.target.innerText;
    } else if (field === 'title') {
      this.aboutContent.title = event.target.innerText;
    }
    
    this.onContentChange();
  }

  private async loadPageContent() {
    try {
      // Cargar media desde localStorage
      let storedMedia = localStorage.getItem('mediaItems');
      let mediaItems: MediaItem[] = storedMedia ? JSON.parse(storedMedia) : [];
      const bannerItem = mediaItems.find(item => item.id === 'banner' && item.section === 'formulario');
      
      if (bannerItem) {
        this.bannerImage = bannerItem.src;
      }

      // Cargar contenido desde el servicio
      const content = await lastValueFrom(this.pageContentService.getPageContent('formulario'));
      if (content) {
        this.bannerImage = content.bannerImage || this.bannerImage;
        this.aboutContent = content.aboutContent || this.aboutContent;
        this.cards = content.cards || this.cards;
      }
    } catch (error) {
      console.error('Error al cargar contenido:', error);
    }
  }

  // Método de prueba temporal
  async testWebpayConnection() {
    try {
      console.log('Probando conexión con Webpay...');
      const response = await lastValueFrom(this.webpayService.testConnection());
      console.log('Respuesta de prueba:', response);
      alert(`Conexión exitosa: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      console.error('Error en prueba de conexión:', error);
      alert(`Error de conexión: ${JSON.stringify(error, null, 2)}`);
    }
  }
}