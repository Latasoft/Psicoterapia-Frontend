import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service';
import { PageContentService } from '../../services/page-content.service';
import { CitasService } from '../../services/citas.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, of, lastValueFrom } from 'rxjs';

declare function gtag(command: string, eventName: string, params: any): void;

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
export class FormularioComponent implements OnInit {
  isLoggedIn = false;
  adminMode = false;
  bannerImage = 'assets/a2.avif';
  uploadingMedia = false;
  selectedFile: File | null = null;

  // Properties for admin mode and content
  aboutContent = {
    title: '',
    description: ''
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

  // Form step control
  step = 1;

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

  // Debounce timeout
  private saveTimeout: any;

  constructor(
    private authService: AuthService,
    private imageService: ImageService,
    private pageContentService: PageContentService,
    private citasService: CitasService,
    private router: Router
  ) {}

  ngOnInit() {
    const loggedIn = this.authService.isLoggedIn();
    this.isLoggedIn = loggedIn;
    if (loggedIn) {
      this.loadPageContent();
    }
    this.cargarTratamientos();
  }

  // Cargar tratamientos disponibles
  async cargarTratamientos() {
    try {
      const tratamientos = await lastValueFrom(this.citasService.obtenerTratamientos());
      this.tratamientosDisponibles = tratamientos;
      console.log('Tratamientos cargados:', this.tratamientosDisponibles);
    } catch (error) {
      console.error('Error al cargar tratamientos:', error);
    }
  }

  // Actualizar precios según tratamiento seleccionado
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

  // Validar fecha y cargar horarios disponibles
  async validarFecha() {
    if (!this.fecha) {
      this.horasDisponibles = [];
      this.errorMessage = '';
      return;
    }

    const fechaSeleccionada = new Date(this.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      this.errorMessage = 'No se puede seleccionar una fecha pasada';
      this.horasDisponibles = [];
      return;
    }

    // Verificar si es domingo
    if (fechaSeleccionada.getDay() === 0) {
      this.errorMessage = 'No se atiende los domingos';
      this.horasDisponibles = [];
      return;
    }

    this.errorMessage = '';
    await this.cargarHorariosDisponibles();
  }


  // Función alternativa para generar slots de 1 hora con formato inicio-fin
  private convertirRangosAHoras(rangos: any[]): string[] {
    const horas: string[] = [];
    
    if (!rangos || !Array.isArray(rangos)) {
      return horas;
    }
    
    rangos.forEach(rango => {
      if (rango && rango.inicio && rango.fin) {
        const inicioHora = parseInt(rango.inicio.split(':')[0]);
        const inicioMin = parseInt(rango.inicio.split(':')[1] || '0');
        const finHora = parseInt(rango.fin.split(':')[0]);
        const finMin = parseInt(rango.fin.split(':')[1] || '0');
        
        // Convertir todo a minutos para facilitar el cálculo
        const inicioTotalMin = inicioHora * 60 + inicioMin;
        const finTotalMin = finHora * 60 + finMin;
        
        // Generar slots de 60 minutos
        for (let minutoActual = inicioTotalMin; minutoActual < finTotalMin; minutoActual += 60) {
          const siguienteSlot = minutoActual + 60;
          
          // Convertir de vuelta a formato HH:MM
          const horaInicioSlot = Math.floor(minutoActual / 60);
          const minInicioSlot = minutoActual % 60;
          const horaFinSlot = Math.floor(siguienteSlot / 60);
          const minFinSlot = siguienteSlot % 60;
          
          const inicioFormateado = `${horaInicioSlot.toString().padStart(2, '0')}:${minInicioSlot.toString().padStart(2, '0')}`;
          const finFormateado = `${horaFinSlot.toString().padStart(2, '0')}:${minFinSlot.toString().padStart(2, '0')}`;
          
          // No agregar slots que excedan el rango original
          if (siguienteSlot <= finTotalMin) {
            horas.push(`${inicioFormateado} - ${finFormateado}`);
          }
        }
      }
    });
    
    // Remover duplicados y ordenar
    return [...new Set(horas)].sort();
  }

  // Cargar horarios disponibles para la fecha seleccionada
  async cargarHorariosDisponibles() {
    try {
      console.log('=== CARGANDO HORARIOS ===');
      console.log('Fecha a consultar:', this.fecha);
      
      const response = await lastValueFrom(
        this.citasService.obtenerHorariosDisponibles(this.fecha)
      );
      
      console.log('Respuesta completa del servidor:', response);
      
      // Verificar la estructura de la respuesta
      if (response && typeof response === 'object') {
        let horariosRaw = response.horariosDisponibles || [];
        console.log('Horarios raw recibidos:', horariosRaw);
        
        // Procesar los horarios según su estructura
        if (horariosRaw.length > 0) {
          if (typeof horariosRaw[0] === 'object' && horariosRaw[0].display) {
            // Nueva estructura con objetos {inicio, fin, display}
            this.horasDisponibles = horariosRaw.map((horario: any) => horario.display);
          } else if (typeof horariosRaw[0] === 'object' && horariosRaw[0].inicio) {
            // Estructura antigua con objetos {inicio, fin}
            this.horasDisponibles = horariosRaw.map((horario: any) => 
              `${horario.inicio} - ${horario.fin}`
            );
          } else {
            // Array de strings simples
            this.horasDisponibles = horariosRaw.filter((hora: any) => typeof hora === 'string');
          }
        } else {
          this.horasDisponibles = [];
        }
        
        console.log('Horarios disponibles procesados:', this.horasDisponibles);
        
        if (this.horasDisponibles.length === 0) {
          console.log('No hay horarios disponibles para esta fecha');
        }
      } else {
        console.error('Respuesta inválida del servidor:', response);
        this.horasDisponibles = [];
      }
      
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      this.horasDisponibles = [];
      this.errorMessage = 'Error al cargar horarios disponibles';
    }
  }

  // Validar si el horario seleccionado es válido
  esHorarioValido(): boolean {
    return this.fecha !== '' && this.hora !== '' && this.horasDisponibles.includes(this.hora);
  }

  // Enviar formulario
  async onSubmit(paymentMethod: string) {
    if (!this.esFormularioValido()) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      // Extraer solo la hora de inicio del formato "HH:MM - HH:MM"
      let horaInicio = this.hora;
      if (this.hora.includes(' - ')) {
        horaInicio = this.hora.split(' - ')[0];
      }
      
      const fechaHora = `${this.fecha}T${horaInicio}:00`;
      
      const citaData = {
        nombre: this.nombre,
        correo: this.correo,
        fecha_hora: fechaHora,
        tratamiento: this.tratamiento
      };

      console.log('Enviando cita:', citaData);
      
      const response = await lastValueFrom(this.citasService.reservarCita(citaData));
      
      console.log('Cita creada:', response);
      alert('¡Cita reservada exitosamente! Te llegará un correo de confirmación.');
      
      // Limpiar formulario
      this.limpiarFormulario();
      
    } catch (error) {
      console.error('Error al reservar cita:', error);
      alert('Error al reservar la cita. Por favor intenta nuevamente.');
    }
  }

  // Validar formulario completo
  esFormularioValido(): boolean {
    return this.nombre.trim() !== '' && 
           this.correo.trim() !== '' && 
           this.tratamiento !== '' && 
           this.esHorarioValido();
  }

  // Limpiar formulario
  limpiarFormulario() {
    this.nombre = '';
    this.correo = '';
    this.tratamiento = '';
    this.fecha = '';
    this.hora = '';
    this.horasDisponibles = [];
    this.precio = { nacional: null, internacional: null, sesiones: null };
    this.step = 1;
  }

  toggleAdminMode() {
    this.adminMode = !this.adminMode;
  }

  // Navigation methods
  goToStep(stepNumber: number) {
    this.step = stepNumber;
  }

  irAPagoKlap() {
    // Implementation for Klap payment
    console.log('Redirigiendo a Klap...');
  }

  // Método para manejar la selección de archivos
  onImageClick(type: string) {
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

  // Método para subir archivos
  async uploadFile(mediaKey: string) {
    if (!this.selectedFile) return;
    
    try {
      this.uploadingMedia = true;
      console.log(`📤 Subiendo archivo para: ${mediaKey}`);
      
      const uploadResponse = await lastValueFrom(
        this.imageService.uploadImage(this.selectedFile, 'formulario')
      );
      
      if (uploadResponse && uploadResponse.secure_url) {
        console.log(`✅ Archivo subido exitosamente:`, uploadResponse);
        
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
      console.error(`❌ Error al subir archivo:`, error);
    } finally {
      this.uploadingMedia = false;
      this.selectedFile = null;
    }
  }

  // Método para guardar media en localStorage
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

  // Método para guardar cambios de contenido
  private async saveContentChanges() {
    if (!this.adminMode) return;

    const content = {
      bannerImage: this.bannerImage,
      aboutContent: {
        title: this.aboutContent.title,
        description: this.aboutContent.description
      },
      cards: this.cards
    };

    console.log('💾 Guardando cambios:', content);

    try {
      const result = await lastValueFrom(
        this.pageContentService.updatePageContent('formulario', content)
      );
      console.log('✅ Contenido actualizado exitosamente:', result);
    } catch (err) {
      console.error('❌ Error al actualizar contenido:', err);
    }
  }

  onContentChange() {
    console.log('🔄 Detectado cambio en el contenido');
    if (!this.adminMode) {
      console.log('❌ Modo admin no activo, ignorando cambios');
      return;
    }
    
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveContentChanges();
    }, 1000);
  }

  onTextChange(event: any, field: string) {
    if (!this.adminMode) return;
    
    console.log('📝 Cambio detectado en:', field);
    
    if (field === 'description') {
      this.aboutContent.description = event.target.innerText;
    } else if (field === 'title') {
      this.aboutContent.title = event.target.innerText;
    }
    
    this.onContentChange();
  }

  private async loadPageContent() {
    try {
      const defaultDescription = `22 años de experiencia profesional en el área clínica, educacional y en relatorías avalan mi trabajo.
        Especialista en Hipnoterapia para trabajar estados depresivos, ansiosos, de angustia, duelos y crisis vitales.
        Atención por FONASA y botón de pago por plataforma KLAP.`;

      let storedMedia = localStorage.getItem('mediaItems');
      let mediaItems: MediaItem[] = storedMedia ? JSON.parse(storedMedia) : [];
      const bannerItem = mediaItems.find(item => item.id === 'banner' && item.section === 'formulario');
      
      if (bannerItem) {
        this.bannerImage = bannerItem.src;
      }

      const content = await lastValueFrom(this.pageContentService.getPageContent('formulario'));
      if (content) {
        this.bannerImage = content.bannerImage || this.bannerImage;
        this.aboutContent = {
          title: content.aboutContent?.title || 'Sobre mí',
          description: content.aboutContent?.description || defaultDescription
        };
        this.cards = content.cards || this.cards;
      }
    } catch (error) {
      console.error('❌ Error al cargar el contenido de la página:', error);
    }
  }

  ngOnDestroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }
}

