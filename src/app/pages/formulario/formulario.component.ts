import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service'; // Cambiado a ImageService
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
    private imageService: ImageService, // Cambiado a ImageService
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
        this.selectedFile = file;
        this.uploadFile(type);
      }
    };
    input.click();
  }

  // Método para subir archivos (actualizado al estilo de inicio.component)
  async uploadFile(mediaKey: string) {
    if (!this.selectedFile) return;
    
    try {
      this.uploadingMedia = true;
      console.log(`📤 Subiendo archivo para: ${mediaKey}`);
      
      // Usar el mismo método que inicio.component
      const uploadResponse = await lastValueFrom(
        this.imageService.uploadImage(this.selectedFile, 'formulario')
      );
      
      if (uploadResponse && uploadResponse.secure_url) {
        console.log(`✅ Archivo subido exitosamente:`, uploadResponse);
        
        // Guardar la URL y el publicId
        const mediaItem: MediaItem = {
          id: mediaKey,
          type: 'image',
          src: uploadResponse.secure_url,
          alt: 'Imagen formulario',
          section: 'formulario',
          publicId: uploadResponse.public_id
        };
        
        // Actualizar la imagen del banner
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

  // Método para guardar media en localStorage (como en inicio.component)
  saveMediaToStorage(mediaItem: MediaItem) {
    let storedMedia = localStorage.getItem('mediaItems');
    let mediaItems: MediaItem[] = storedMedia ? JSON.parse(storedMedia) : [];
    
    // Actualizar o agregar el nuevo item
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

  // Método actualizado para cargar el contenido de la página
  private async loadPageContent() {
    try {
      const defaultDescription = `22 años de experiencia profesional en el área clínica, educacional y en relatorías avalan mi trabajo.
        Especialista en Hipnoterapia para trabajar estados depresivos, ansiosos, de angustia, duelos y crisis vitales.
        Atención por FONASA y botón de pago por plataforma KLAP.`;

      // Cargar media items de localStorage
      let storedMedia = localStorage.getItem('mediaItems');
      let mediaItems: MediaItem[] = storedMedia ? JSON.parse(storedMedia) : [];
      const bannerItem = mediaItems.find(item => item.id === 'banner' && item.section === 'formulario');
      
      if (bannerItem) {
        this.bannerImage = bannerItem.src;
      }

      const content = await lastValueFrom(this.pageContentService.getPageContent('formulario'));
      if (content) {
        // Si hay contenido en Firebase, tiene prioridad sobre localStorage
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

