import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { MediaService } from '../../services/medio.service';
import { PageContentService } from '../../services/page-content.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
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
  bannerImage = 'assets/default-banner.jpg';
  uploadingFiles: { [key: string]: boolean } = {};

  // Properties for admin mode and content
  aboutContent = {
    title: 'Sobre mí',
    description: `22 años de experiencia profesional en el área clínica, educacional y en relatorías avalan mi trabajo.
      Especialista en Hipnoterapia para trabajar estados depresivos, ansiosos, de angustia, duelos y crisis vitales.
      Atención por FONASA y botón de pago por plataforma KLAP.`
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

  constructor(
    private authService: AuthService,
    private mediaService: MediaService,
    private pageContentService: PageContentService
  ) {}

  ngOnInit() {
    this.authService.isLoggedIn().subscribe(
      loggedIn => this.isLoggedIn = loggedIn
    );
    this.loadPageContent();
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

      const result = await this.mediaService.uploadMedia(formData).toPromise();
      
      if (result && result.url) {
        if (mediaKey === 'banner') {
          this.bannerImage = result.url;
          this.onContentChange();
        }
        console.log(`✅ Archivo subido exitosamente para: ${mediaKey}`);
      }
    } catch (error) {
      console.error(`❌ Error al subir archivo para ${mediaKey}:`, error);
    } finally {
      this.uploadingFiles[mediaKey] = false;
    }
  }

  // Método para verificar si se está subiendo un archivo
  isUploading(mediaKey: string): boolean {
    return this.uploadingFiles[mediaKey] || false;
  }

  // Método para cargar el contenido de la página
  loadPageContent() {
    this.pageContentService.getPageContent('formulario').subscribe({
      next: (content) => {
        if (content) {
          this.bannerImage = content.bannerImage || this.bannerImage;
          this.aboutContent = content.aboutContent || this.aboutContent;
          this.cards = content.cards || this.cards;
        }
      },
      error: (err) => console.error('Error loading content:', err)
    });
  }

  // Método para guardar cambios
  onContentChange() {
    if (!this.adminMode) return;

    const content = {
      bannerImage: this.bannerImage,
      aboutContent: this.aboutContent,
      cards: this.cards
    };

    this.pageContentService.updatePageContent('formulario', content).subscribe({
      next: () => console.log('✅ Contenido actualizado exitosamente'),
      error: (err) => console.error('❌ Error al actualizar contenido:', err)
    });
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
    // Initialize available treatments
    this.tratamientosDisponibles = [
      { nombre: 'Tratamiento 1' },
      { nombre: 'Tratamiento 2' }
      // Add more treatments as needed
    ];
  }
}

