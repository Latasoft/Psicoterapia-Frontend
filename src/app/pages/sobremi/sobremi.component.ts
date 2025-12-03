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
import { ToastService } from '../../services/toast.service';

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

  // Flag de carga - no mostrar contenido hasta que cargue del backend
  contentLoaded = false;

  // Content properties - inicialmente vacíos hasta que cargue el backend
  profileName = '';
  profileTitle = '';
  profileSubtitle = '';
  profileImageUrl = '';
  
  aboutTitle = '';
  aboutDescription = '';

  cards = [
    { title: '', description: '' },
    { title: '', description: '' },
    { title: '', description: '' }
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
    private imageService: ImageService,
    private toastService: ToastService
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
      console.log('📥 Cargando contenido desde backend...');
      const content = await lastValueFrom(this.pageContentService.getPageContent('sobremi'));
      
      if (content && Object.keys(content).length > 0) {
        console.log('✅ Contenido del backend recibido:', content);
        
        // Mapear contenido desde el backend - SIN fallbacks
        this.profileName = content['profile-name'] || '';
        this.profileTitle = content['profile-title'] || '';
        this.profileSubtitle = content['profile-subtitle'] || '';
        this.profileImageUrl = content['profile-image'] || '';
        
        this.aboutTitle = content['about-title'] || '';
        this.aboutDescription = content['about-description'] || '';
        
        // Cards
        this.cards[0].title = content['card-0-title'] || '';
        this.cards[0].description = content['card-0-description'] || '';
        this.cards[1].title = content['card-1-title'] || '';
        this.cards[1].description = content['card-1-description'] || '';
        this.cards[2].title = content['card-2-title'] || '';
        this.cards[2].description = content['card-2-description'] || '';
        
        // Social links
        if (content['social-whatsapp']) this.socialLinks.whatsapp = content['social-whatsapp'];
        if (content['social-instagram']) this.socialLinks.instagram = content['social-instagram'];
        if (content['social-facebook']) this.socialLinks.facebook = content['social-facebook'];
        if (content['social-linkedin']) this.socialLinks.linkedin = content['social-linkedin'];
        if (content['social-tiktok']) this.socialLinks.tiktok = content['social-tiktok'];
      } else {
        console.warn('⚠️ Backend no devolvió contenido para sobremi');
      }
    } catch (error) {
      console.error('❌ Error al cargar contenido:', error);
    } finally {
      // Marcar como cargado SIEMPRE, incluso si hay error
      this.contentLoaded = true;
      console.log('🏁 Carga completada, contentLoaded =', this.contentLoaded);
    }
  }

  // Manejo de cambio de imagen de perfil
  async onImageChange(file: File, imageKey: string) {
    if (!this.isAdmin) {
      this.toastService.error('Necesitas estar autenticado como admin para subir archivos');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.toastService.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      return;
    }

    this.uploadingItem = imageKey;

    try {
      console.log(`🚀 Uploading image for ${imageKey}`);
      
      const uploadResponse = await lastValueFrom(
        this.imageService.uploadImage(file, 'sobremi')
      );

      if (uploadResponse && uploadResponse.success && uploadResponse.data && uploadResponse.data.secure_url) {
        // Actualizar URL de imagen localmente
        if (imageKey === 'profile-image') {
          this.profileImageUrl = uploadResponse.data.secure_url;
        }
        
        console.log('✅ Imagen subida exitosamente:', uploadResponse.data.secure_url);
        
        // 🔥 IMPORTANTE: Guardar la nueva URL en el backend
        await this.saveImageToBackend(imageKey, uploadResponse.data.secure_url);
        
        this.toastService.success('Imagen actualizada correctamente');
      } else {
        throw new Error('Error en la respuesta de subida');
      }
    } catch (error) {
      console.error('❌ Error al subir imagen:', error);
      this.toastService.error('Error al subir la imagen. Por favor, intenta nuevamente.');
    } finally {
      this.uploadingItem = null;
    }
  }

  // Guardar URL de imagen en el backend
  private async saveImageToBackend(imageKey: string, imageUrl: string) {
    try {
      console.log(`💾 Guardando ${imageKey} en backend:`, imageUrl);
      
      const updateData: any = {};
      updateData[imageKey] = imageUrl;
      
      await lastValueFrom(
        this.pageContentService.updatePageContent('sobremi', updateData)
      );
      
      console.log('✅ URL guardada en backend correctamente');
    } catch (error) {
      console.error('❌ Error al guardar en backend:', error);
      // No lanzar error para no interrumpir el flujo
    }
  }
}
