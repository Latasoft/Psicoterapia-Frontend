import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { PageContentService } from '../../services/page-content.service';
import { EditableContentDirective } from '../../directives/editable-content.directive';
import { EditableImageDirective } from '../../directives/editable-image.directive';
import { EditableLinkDirective } from '../../directives/editable-link.directive';
import { EditModeIndicatorComponent } from '../../components/edit-mode-indicator/edit-mode-indicator.component';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-sobremi',
  standalone: true,
  imports: [
    CommonModule,
    EditableContentDirective,
    EditableImageDirective,
    EditableLinkDirective,
    EditModeIndicatorComponent
  ],
  templateUrl: './sobremi.component.html',
  styleUrl: './sobremi.component.css'
})
export class SobremiComponent implements OnInit, OnDestroy {
  // Admin properties
  isAdmin = false;
  uploadingItem: string | null = null;

  // Content properties - valores por defecto
  profileName = 'Eduardo Cristián Márquez Huerta';
  profileTitle = 'Psicólogo e Hipnoterapéuta Clínico, Universidad Santo Tomás, Santiago de Chile, año 2002';
  profileSubtitle = 'Atención niños (8 a 10 años), adolescentes y adultos';
  profileImageUrl = 'assets/h5.avif';
  
  aboutTitle = 'Sobre mí';
  aboutDescription = '22 años de experiencia profesional en el área clínica, educacional y en relatorías avalan mi trabajo. Especialista en Hipnoterapia para trabajar estados depresivos, ansiosos, de angustia, duelos y crisis vitales.';

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

  // Social links
  socialLinks = {
    whatsapp: 'https://wa.me/56994739587?text=¡Hola!%20Me%20interesa%20tu%20servicio',
    instagram: 'https://www.instagram.com/emhpsicoterapiaonline/',
    facebook: 'https://www.facebook.com/tuapoyopsicologico2.0',
    linkedin: 'https://www.linkedin.com/in/eduardo-m%C3%A1rquez-huerta-7a840915/',
    tiktok: 'https://www.tiktok.com/@emhpsicoterapiaonline'
  };

  constructor(
    private authService: AuthService,
    private pageContentService: PageContentService,
    private imageService: ImageService
  ) {}

  ngOnInit() {
    this.checkAdminStatus();
    this.loadPageContent();
  }

  ngOnDestroy() {
    // Cleanup si es necesario
  }

  checkAdminStatus() {
    this.isAdmin = this.authService.isAdmin();
  }

  async loadPageContent() {
    try {
      const content = await lastValueFrom(this.pageContentService.getPageContent('sobremi'));
      if (content && Object.keys(content).length > 0) {
        // Mapear contenido desde el backend
        this.profileName = content['profile-name'] || this.profileName;
        this.profileTitle = content['profile-title'] || this.profileTitle;
        this.profileSubtitle = content['profile-subtitle'] || this.profileSubtitle;
        this.profileImageUrl = content['profile-image'] || this.profileImageUrl;
        
        this.aboutTitle = content['about-title'] || this.aboutTitle;
        this.aboutDescription = content['about-description'] || this.aboutDescription;
        
        // Cards
        if (content['card-0-title']) {
          this.cards[0].title = content['card-0-title'];
          this.cards[0].description = content['card-0-description'] || this.cards[0].description;
        }
        if (content['card-1-title']) {
          this.cards[1].title = content['card-1-title'];
          this.cards[1].description = content['card-1-description'] || this.cards[1].description;
        }
        if (content['card-2-title']) {
          this.cards[2].title = content['card-2-title'];
          this.cards[2].description = content['card-2-description'] || this.cards[2].description;
        }
        
        // Social links
        if (content['social-whatsapp']) this.socialLinks.whatsapp = content['social-whatsapp'];
        if (content['social-instagram']) this.socialLinks.instagram = content['social-instagram'];
        if (content['social-facebook']) this.socialLinks.facebook = content['social-facebook'];
        if (content['social-linkedin']) this.socialLinks.linkedin = content['social-linkedin'];
        if (content['social-tiktok']) this.socialLinks.tiktok = content['social-tiktok'];
      }
    } catch (error) {
      console.error('Error al cargar contenido:', error);
    }
  }

  // Manejo de cambio de imagen de perfil
  async onImageChange(file: File, imageKey: string) {
    if (!this.isAdmin) {
      alert('Necesitas estar autenticado como admin para subir archivos');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
      return;
    }

    this.uploadingItem = imageKey;

    try {
      console.log(`🚀 Uploading image for ${imageKey}`);
      
      const uploadResponse = await lastValueFrom(
        this.imageService.uploadImage(file, 'sobremi')
      );

      if (uploadResponse && uploadResponse.success) {
        // Actualizar URL de imagen
        if (imageKey === 'profile-image') {
          this.profileImageUrl = uploadResponse.url;
        }
        
        console.log('✅ Imagen subida exitosamente:', uploadResponse.url);
      } else {
        throw new Error('Error en la respuesta de subida');
      }
    } catch (error) {
      console.error('❌ Error al subir imagen:', error);
      alert('Error al subir la imagen. Por favor, intenta nuevamente.');
    } finally {
      this.uploadingItem = null;
    }
  }
}
