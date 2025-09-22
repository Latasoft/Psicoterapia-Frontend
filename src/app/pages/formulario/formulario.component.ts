import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { MediaService } from '../../services/media.service';
import { PageContentService } from '../../services/page-content.service';
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
  nombre: string;
  // Add other properties as needed
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
  bannerImage = ''; // Removido valor por defecto
  uploadingFiles: { [key: string]: boolean } = {};

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
    private mediaService: MediaService,
    private pageContentService: PageContentService,
    private router: Router
  ) {}

  ngOnInit() {
    const loggedIn = this.authService.isLoggedIn();
    this.isLoggedIn = loggedIn;
    if (loggedIn) {
      this.loadPageContent();
    }
    this.initializeTratamientos();
  }

  toggleAdminMode() {
    this.adminMode = !this.adminMode;
  }

  // Método para manejar la selección de archivos
  onImageClick(type: string) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.uploadFile(file, type);
      }
    };
    input.click();
  }

  // Método para subir archivos
  async uploadFile(file: File, mediaKey: string) {
    try {
      this.uploadingFiles[mediaKey] = true;
      console.log(`📤 Subiendo archivo para: ${mediaKey}`);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaKey', mediaKey);

      const result = await lastValueFrom(this.mediaService.uploadMedia(formData)) as { url?: string };
      
      if (result && result.url) {
        if (mediaKey === 'banner') {
          this.bannerImage = result.url;
          await this.saveContentChanges();
        }
        console.log(`✅ Archivo subido exitosamente para: ${mediaKey}`);
      }
    } catch (error) {
      console.error(`❌ Error al subir archivo para ${mediaKey}:`, error);
    } finally {
      this.uploadingFiles[mediaKey] = false;
    }
  }

  // New method to handle content saving
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

    console.log('💾 Guardando cambios:', {
      title: content.aboutContent.title,
      description: content.aboutContent.description
    });

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
    
    console.log('📦 Contenido actual:', {
      description: this.aboutContent.description,
      title: this.aboutContent.title
    });
    
    // Debounce para no hacer muchas llamadas seguidas
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

  // Navigation methods
  goToStep(stepNumber: number) {
    this.step = stepNumber;
  }

  // Form handling methods
  actualizarPrecio() {
    // Implementation for updating prices based on selected treatment
  }

  validarFecha() {
    // Implementation for date validation
  }

  esHorarioValido(): boolean {
    return this.fecha !== '' && this.hora !== '';
  }

  onSubmit(paymentMethod: string) {
    // Implementation for form submission
  }

  irAPagoKlap() {
    // Implementation for Klap payment
  }

  private initializeTratamientos() {
    this.tratamientosDisponibles = [
      { nombre: 'Psicoterapia Individual' },
      { nombre: 'Terapia de Pareja' },
      { nombre: 'Hipnoterapia' }
    ];
  }

  // Method to load page content for admin mode
  private async loadPageContent() {
    try {
      const defaultDescription = `22 años de experiencia profesional en el área clínica, educacional y en relatorías avalan mi trabajo.
        Especialista en Hipnoterapia para trabajar estados depresivos, ansiosos, de angustia, duelos y crisis vitales.
        Atención por FONASA y botón de pago por plataforma KLAP.`;

      const content = await lastValueFrom(this.pageContentService.getPageContent('formulario'));
      if (content) {
        this.bannerImage = content.bannerImage || '';
        this.aboutContent = {
          title: content.aboutContent?.title || 'Sobre mí',
          description: content.aboutContent?.description || defaultDescription
        };
        this.cards = content.cards || [];
      } else {
        console.log('⚠️ No se encontró contenido, usando valores por defecto');
        this.aboutContent = {
          title: 'Sobre mí',
          description: defaultDescription
        };
      }
    } catch (error) {
      console.error('❌ Error al cargar el contenido de la página:', error);
      // En caso de error, también usamos los valores por defecto
      const defaultDescription = `22 años de experiencia profesional en el área clínica, educacional y en relatorías avalan mi trabajo.
        Especialista en Hipnoterapia para trabajar estados depresivos, ansiosos, de angustia, duelos y crisis vitales.
        Atención por FONASA y botón de pago por plataforma KLAP.`;
      this.aboutContent = {
        title: 'Sobre mí',
        description: defaultDescription
      };
    }
  }

  ngOnDestroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }
}

