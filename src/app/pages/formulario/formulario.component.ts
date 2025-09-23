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
  styleUrls: ['./formulario.component.css']
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

  // Form fields
  tratamiento = '';
  nombre = '';
  correo = '';
  fecha: string = '';
  hora: string = '';

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

  constructor(
    private authService: AuthService,
    private imageService: ImageService,
    private pageContentService: PageContentService,
    private citasService: CitasService,
    private webpayService: WebpayService,
    private router: Router
  ) {}

  ngOnInit() {
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
      
      console.log('Respuesta horarios:', response);
      
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
        }
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
           this.tratamiento !== '' && 
           this.esHorarioValido();
  }

  esHorarioValido(): boolean {
    return this.fecha !== '' && 
           this.hora !== '' && 
           this.horasDisponibles.includes(this.hora);
  }

  esPasoValido(paso: number): boolean {
    switch (paso) {
      case 1:
        return this.nombre.trim() !== '' && 
               this.correo.trim() !== '' && 
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
    }
  }

  pasoAnterior() {
    if (this.step > 1) {
      this.step--;
    }
  }

  // ========== PAGOS ==========
  // Enviar formulario con integración de pagos
  async onSubmit(paymentMethod: string) {
    if (!this.esFormularioValido()) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    this.procesandoPago = true;

    try {
      console.log('=== INICIANDO PROCESO DE PAGO ===');
      console.log('Método de pago:', paymentMethod);
      console.log('Datos del formulario:', {
        nombre: this.nombre,
        correo: this.correo,
        tratamiento: this.tratamiento,
        fecha: this.fecha,
        hora: this.hora,
        precio: this.precio
      });

      // Crear la cita primero
      const citaId = await this.crearCita();
      
      if (!citaId) {
        throw new Error('No se pudo crear la cita. Verifique los datos ingresados.');
      }

      console.log('Cita creada con ID:', citaId);

      // Procesar pago según método
      switch (paymentMethod) {
        case 'webpay':
          await this.procesarPagoWebpay(citaId);
          break;
        case 'mercadopago':
          await this.procesarPagoMercadoPago(citaId);
          break;
        case 'klap':
          this.irAPagoKlap();
          break;
        default:
          alert('¡Cita reservada exitosamente! Te llegará un correo de confirmación.');
          this.limpiarFormulario();
          break;
      }
      
    } catch (error) {
      console.error('Error detallado en onSubmit:', error);
      
      let errorMessage = 'Error desconocido al procesar la solicitud.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        const errObj = error as { error?: any; message?: string };
        if (errObj.error && typeof errObj.error === 'object' && 'message' in errObj.error) {
          errorMessage = errObj.error.message;
        } else if (errObj.message) {
          errorMessage = errObj.message;
        } else if (errObj.error) {
          errorMessage = JSON.stringify(errObj.error);
        }
      }
      
      console.error('Mensaje de error procesado:', errorMessage);
      alert(`Error: ${errorMessage}\n\nPor favor intenta nuevamente o contacta al administrador.`);
    } finally {
      this.procesandoPago = false;
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
      
      const fechaHora = `${this.fecha}T${horaInicio}:00`;
      
      const citaData = {
        nombre: this.nombre.trim(),
        correo: this.correo.trim().toLowerCase(),
        fecha_hora: fechaHora,
        tratamiento: this.tratamiento
      };

      console.log('Datos de la cita a enviar:', citaData);
      
      // Validar datos antes de enviar
      if (!citaData.nombre || citaData.nombre.length < 2) {
        throw new Error('El nombre debe tener al menos 2 caracteres');
      }
      
      if (!this.validarEmail(citaData.correo)) {
        throw new Error('El correo electrónico no es válido');
      }
      
      if (!citaData.tratamiento) {
        throw new Error('Debe seleccionar un tratamiento');
      }
      
      const response = await lastValueFrom(this.citasService.reservarCita(citaData));
      
      console.log('Respuesta del servidor al crear cita:', response);
      
      if (!response) {
        throw new Error('No se recibió respuesta del servidor');
      }
      
      return response.citaId || response.id || 'cita-creada';
      
    } catch (error) {
      console.error('Error detallado al crear cita:', error);
      
      if (error instanceof Error) {
        throw error;
      } else if (error && typeof error === 'object' && (error as any).error) {
        throw new Error((error as any).error.message || 'Error del servidor al crear la cita');
      } else {
        throw new Error('Error desconocido al crear la cita');
      }
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
    console.log('Procesando pago MercadoPago para cita:', citaId);
    alert('Integración de MercadoPago próximamente disponible');
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
      await this.crearCitaConPago(citaData);
      
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
      
      const citaParaEnviar = {
        nombre: citaData.nombre.trim(),
        correo: citaData.correo.trim().toLowerCase(),
        fecha_hora: fechaHora,
        tratamiento: citaData.tratamiento,
        monto: citaData.monto,
        estado_pago: citaData.estadoPago,
        metodo_pago: citaData.metodoPago,
        fecha_pago: citaData.fechaPago
      };

      console.log('Creando cita con pago:', citaParaEnviar);
      
      const response = await lastValueFrom(this.citasService.reservarCita(citaParaEnviar));
      
      console.log('Cita con pago creada:', response);
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