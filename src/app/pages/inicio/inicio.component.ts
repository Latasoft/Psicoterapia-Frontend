import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service';
import { PageContentService } from '../../services/page-content.service';
import { PaquetesService } from '../../services/paquetes.service';
import { ComentariosService } from '../../services/comentarios.service';
import { Paquete } from '../../interfaces/paquetes.interface';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../environments/environment';
import { EditableContentDirective } from '../../directives/editable-content.directive';
import { EditableImageDirective } from '../../directives/editable-image.directive';
import { EditableVideoDirective } from '../../directives/editable-video.directive';
import { EditModeIndicatorComponent } from '../../components/edit-mode-indicator/edit-mode-indicator.component';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  src: string;
  alt?: string;
  section: string;
  publicId?: string;
}

@Component({
    selector: 'app-inicio',
    imports: [
      RouterModule, 
      FormsModule, 
      CommonModule,
      EditableContentDirective,
      EditableImageDirective,
      EditableVideoDirective,
      EditModeIndicatorComponent
    ],
    templateUrl: './inicio.component.html',
    styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {
  ultimosBlogs: any[] = [];
  isAdmin: boolean = false;
  adminMode: boolean = false;
  errorMessage: string = '';
  
  // Media items que se pueden editar
  mediaItems: MediaItem[] = [
    { id: 'hero-image', type: 'image', src: 'assets/h2.jpg', alt: 'Logo', section: 'hero' },
    { id: 'hero-video', type: 'video', src: 'assets/videos/si1.mp4', section: 'hero' },
    { id: 'service1-image', type: 'image', src: 'assets/h11.png', alt: 'Psicoterapia', section: 'services' },
    { id: 'service2-image', type: 'image', src: 'assets/h12.avif', alt: 'Taller', section: 'services' },
    { id: 'tarot-image', type: 'image', src: 'assets/tarot3.jpeg', alt: 'Tarot', section: 'tarot' },
    { id: 'contact-video', type: 'video', src: 'assets/videos/si2.mp4', section: 'contact' }
  ];

  selectedFile: File | null = null;
  uploadingItem: string | null = null;

  // Propiedades para los datos editables - se cargan del backend
  contactInfo: any = {};
  tarotText: any = {};
  services: any[] = []; // Deprecated - will be replaced with paquetes
  paquetes: Paquete[] = [];
  conveniosInfo: any = {};
  currentYear = new Date().getFullYear();

  // Comentarios
  comentarios: any[] = [];
  nuevoComentario = {
    author_name: '',
    comment_text: '',
    rating: 5
  };
  enviandoComentario = false;
  mensajeComentario = '';

  constructor(
    private blogService: BlogService,
    private authService: AuthService,
    private imageService: ImageService,
    private pageContentService: PageContentService,
    private paquetesService: PaquetesService,
    private comentariosService: ComentariosService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.cargarUltimosBlogs();
    this.cargarPaquetes();
    this.cargarComentarios();
    this.checkAdminStatus();
    this.loadMediaFromStorage();
    this.loadPageContent();
    this.testImageService(); // Añadir esta línea
  }

  cargarUltimosBlogs() {
    this.blogService.getBlogs({ page: 1, limit: 4, sortBy: 'created_at', sortOrder: 'desc' }).subscribe({
      next: (response) => {
        this.ultimosBlogs = response.data;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar los blogs';
        console.error(error);
      }
    });
  }

  cargarPaquetes() {
    this.paquetesService.getPaquetes().subscribe({
      next: (paquetes) => {
        // Filtrar solo paquetes activos y destacados para mostrar en inicio
        this.paquetes = paquetes.filter(p => p.activo).slice(0, 6);
      },
      error: (error) => {
        console.error('Error al cargar paquetes:', error);
      }
    });
  }

  checkAdminStatus() {
      const isAdmin = this.authService.isAdmin();
      const role = localStorage.getItem('userRole');
      console.log('🔍 Check Admin Status:', { isAdmin, role, isLoggedIn: this.authService.isLoggedIn() });
      this.isAdmin = isAdmin;
  }

  toggleAdminMode() {
    this.adminMode = !this.adminMode;
  }

  loadMediaFromStorage() {
    const savedMedia = localStorage.getItem('homepage-media');
    if (savedMedia) {
      try {
        const customMedia = JSON.parse(savedMedia);
        this.mediaItems = this.mediaItems.map(item => {
          const saved = customMedia.find((saved: any) => saved.id === item.id);
          return saved ? { ...item, src: saved.src, publicId: saved.publicId } : item;
        });
      } catch (error) {
        console.error('Error parsing saved media:', error);
      }
    }
  }

  saveMediaToStorage() {
    const mediaToSave = this.mediaItems.map(item => ({
      id: item.id,
      src: item.src,
      publicId: item.publicId
    }));
    localStorage.setItem('homepage-media', JSON.stringify(mediaToSave));
  }

  onFileSelected(event: any, itemId: string) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Si es una imagen de servicio, usar el flujo específico para servicios
      if (itemId.includes('service') && itemId.includes('image')) {
        this.uploadServiceImage(itemId);
      } else {
        // Para otros elementos multimedia (hero, tarot, contact)
        this.uploadMedia(itemId);
      }
    }
  }

  async uploadServiceImage(serviceImageKey: string) {
    if (!this.selectedFile) return;

    // Verificar autenticación
    if (!this.isAdmin) {
      alert('Necesitas estar autenticado para subir archivos');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
      return;
    }

    // Encontrar el índice del servicio
    const serviceIndex = this.services.findIndex(service => service.imageKey === serviceImageKey);
    if (serviceIndex === -1) {
      alert('Servicio no encontrado');
      return;
    }

    this.uploadingItem = serviceImageKey;

    try {
      console.log(`🚀 Uploading service image for service index: ${serviceIndex}`);

      // Crear FormData para enviar la imagen
      const formData = new FormData();
      formData.append('imagen', this.selectedFile);

      // Llamar al nuevo endpoint específico para imágenes de servicios
      const response = await fetch(`${environment.apiUrl}/api/page-content/inicio/service-image/${serviceIndex}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Actualizar el servicio local con la nueva URL
        this.services[serviceIndex].imageUrl = result.data.secure_url;
        this.services[serviceIndex].imagePublicId = result.data.public_id;

        console.log('✅ Service image updated:', result.data.secure_url);
        alert('Imagen del servicio actualizada exitosamente');
      } else {
        throw new Error(result.error || 'Error al subir imagen');
      }

    } catch (error) {
      console.error('Error uploading service image:', error);
      alert('Error al subir la imagen del servicio. Por favor, inténtalo de nuevo.');
    } finally {
      this.uploadingItem = null;
      this.selectedFile = null;
    }
  }

  async uploadMedia(itemId: string) {
    if (!this.selectedFile) return;

    // Verificar si el usuario está autenticado
    if (!this.isAdmin) {
      alert('Necesitas estar autenticado para subir archivos');
      return;
    }

    // Verificar si hay token
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
      return;
    }

    this.uploadingItem = itemId;
    const item = this.mediaItems.find(m => m.id === itemId);
    
    if (!item) {
      this.uploadingItem = null;
      return;
    }

    try {
      let uploadResponse;
      
      console.log(`🚀 Uploading ${item.type} for ${itemId}`);
      
      if (item.type === 'image') {
        uploadResponse = await this.imageService.uploadImage(this.selectedFile, 'homepage').toPromise();
      } else {
        uploadResponse = await this.imageService.uploadVideo(this.selectedFile, 'homepage').toPromise();
      }

      if (uploadResponse && uploadResponse.success) {
        // Eliminar imagen anterior si existe
        if (item.publicId) {
          try {
            await this.imageService.deleteImage(item.publicId).toPromise();
          } catch (deleteError) {
            console.warn('Error deleting previous media:', deleteError);
          }
        }

        // Actualizar el item
        item.src = uploadResponse.data.secure_url;
        item.publicId = uploadResponse.data.public_id;

        // Guardar en localStorage
        this.saveMediaToStorage();

        alert('Media actualizada exitosamente');
      } else {
        throw new Error('Upload response was not successful');
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string' &&
          ((error as any).message.includes('401') || (error as any).message.includes('403'))) {
        alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else {
        alert('Error al subir el archivo. Por favor, inténtalo de nuevo.');
      }
    } finally {
      this.uploadingItem = null;
      this.selectedFile = null;
    }
  }

  async deleteMedia(itemId: string) {
    // Si es una imagen de servicio, usar el flujo específico
    if (itemId.includes('service') && itemId.includes('image')) {
      await this.deleteServiceImage(itemId);
      return;
    }

    // Para otros elementos multimedia (hero, tarot, contact)
    const item = this.mediaItems.find(m => m.id === itemId);
    if (!item || !item.publicId) {
      alert('No hay media personalizada para eliminar');
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar esta media?')) {
      try {
        await this.imageService.deleteImage(item.publicId).toPromise();
        
        // Restaurar a la imagen/video por defecto
        const defaultItem = this.getDefaultMediaItem(itemId);
        if (defaultItem) {
          item.src = defaultItem.src;
          item.publicId = undefined;
          this.saveMediaToStorage();
        }

        alert('Media eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting media:', error);
        alert('Error al eliminar el archivo');
      }
    }
  }

  async deleteServiceImage(serviceImageKey: string) {
    const serviceIndex = this.services.findIndex(service => service.imageKey === serviceImageKey);
    if (serviceIndex === -1) {
      alert('Servicio no encontrado');
      return;
    }

    const service = this.services[serviceIndex];
    if (!service.imagePublicId) {
      alert('No hay imagen personalizada para eliminar');
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar esta imagen del servicio?')) {
      try {
        // Eliminar imagen de Cloudinary
        await this.imageService.deleteImage(service.imagePublicId).toPromise();

        // Restaurar imagen por defecto
        service.imageUrl = 'assets/h11.png'; // Imagen por defecto
        service.imagePublicId = null;

        // Guardar cambios en Firebase
        this.savePageContent();

        alert('Imagen del servicio eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting service image:', error);
        alert('Error al eliminar la imagen del servicio');
      }
    }
  }

  getDefaultMediaItem(itemId: string): MediaItem | undefined {
    const defaults: { [key: string]: string } = {
      'hero-image': 'assets/h2.jpg',
      'hero-video': 'assets/videos/si1.mp4',
      'service1-image': 'assets/h11.png',
      'service2-image': 'assets/h12.avif',
      'tarot-image': 'assets/tarot3.jpeg',
      'contact-video': 'assets/videos/si2.mp4'
    };

    return defaults[itemId] ? { 
      id: itemId, 
      type: itemId.includes('video') ? 'video' : 'image', 
      src: defaults[itemId], 
      section: '' 
    } : undefined;
  }

  getMediaSrc(itemId: string): string {
    // Para imágenes de servicios, buscar en el array de services
    if (itemId.startsWith('service') && itemId.endsWith('-image')) {
      // Extraer el índice del servicio del itemId (ej: "service1-image" -> 0, "service2-image" -> 1)
      const serviceMatch = itemId.match(/service(\d+)-image/);
      if (serviceMatch) {
        const serviceIndex = parseInt(serviceMatch[1]) - 1; // Convertir a índice base 0
        if (this.services && this.services[serviceIndex] && this.services[serviceIndex].imageUrl) {
          return this.services[serviceIndex].imageUrl;
        }
      }
      
      // Si no se encuentra en services, buscar en el array dinámico por imageKey
      const serviceByKey = this.services?.find(service => service.imageKey === itemId);
      if (serviceByKey && serviceByKey.imageUrl) {
        return serviceByKey.imageUrl;
      }
    }
    
    // Para otros elementos multimedia (hero, tarot, contact), usar el sistema existente
    const item = this.mediaItems.find(m => m.id === itemId);
    return item ? item.src : this.getDefaultImageForService(itemId);
  }

  private getDefaultImageForService(itemId: string): string {
    const defaults: { [key: string]: string } = {
      'hero-image': 'assets/h2.jpg',
      'hero-video': 'assets/videos/si1.mp4',
      'service1-image': 'assets/h11.png',
      'service2-image': 'assets/h12.avif',
      'tarot-image': 'assets/tarot3.jpeg',
      'contact-video': 'assets/videos/si2.mp4'
    };
    return defaults[itemId] || 'assets/h11.png'; // Imagen por defecto para servicios nuevos
  }

  sanitizarUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  isUploading(itemId: string): boolean {
    return this.uploadingItem === itemId;
  }

  testImageService() {
    console.log('🔍 Probando conexión con:', `${environment.apiUrl}/api/images/test`);
    
    this.imageService.testConnection().subscribe({
      next: (response) => {
        console.log('✅ Image service connected:', response);
      },
      error: (error) => {
        console.error('❌ Image service error:', error);
        console.log('📍 Verificar:');
        console.log('1. Backend ejecutándose en:', environment.apiUrl);
        console.log('2. CORS configurado correctamente');
        console.log('3. Ruta /api/images/test existe');
      }
    });
  }

  // Cargar contenido de la página desde el backend
  loadPageContent() {
    console.log('🔄 Loading page content...');
    
    this.pageContentService.getPageContent('inicio').pipe(
      catchError(error => {
        console.error('❌ Error loading page content:', {
          status: error.status,
          message: error.message,
          url: error.url
        });
        
        // Return default values as fallback
        return of({
          contactInfo: { title: 'Contacto', items: [] },
          tarotText: { content: '' },
          services: [],
          conveniosInfo: { title: 'Convenios', description: '' }
        });
      })
    ).subscribe({
      next: (content) => {
        console.log('✅ Page content loaded:', content);
        this.contactInfo = content.contactInfo || {};
        this.tarotText = content.tarotText || {};
        this.services = content.services || [];
        this.conveniosInfo = content.conveniosInfo || {};
      },
      error: (err) => console.error('💥 Unexpected error:', err),
      complete: () => console.log('🏁 Page content load complete')
    });
  }


  // Guardar contenido de la página
  savePageContent() {
    // Solo guardar si el usuario es admin y está en modo edición
    if (!this.isAdmin) {
      return;
    }

    const content = {
      contactInfo: this.contactInfo,
      tarotText: this.tarotText,
      services: this.services,
      conveniosInfo: this.conveniosInfo
    };

    this.pageContentService.updatePageContent('inicio', content).subscribe({
      next: () => {
        console.log('Contenido guardado exitosamente');
      },
      error: (error) => {
        console.error('Error al guardar contenido:', error);
      }
    });
  }

  // Método para guardar cambios cuando el usuario termine de editar
  onContentChange() {
    if (!this.isAdmin) {
      return;
    }
    
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.savePageContent();
    }, 1000);
  }

  private saveTimeout: any;

  // Métodos para manejar los datos editables
  addContactItem() {
    this.contactInfo.items.push('');
    this.savePageContent();
  }

  removeContactItem(index: number) {
    this.contactInfo.items.splice(index, 1);
    this.savePageContent();
  }

  addServiceItem(serviceIndex: number) {
    this.services[serviceIndex].items.push('');
    this.savePageContent();
  }

  removeServiceItem(serviceIndex: number, itemIndex: number) {
    this.services[serviceIndex].items.splice(itemIndex, 1);
    this.savePageContent();
  }

  addService() {
    const newService = {
      imageKey: `service${this.services.length + 1}-image`,
      imageUrl: 'assets/h11.png', // URL por defecto
      imagePublicId: null, // ID de Cloudinary cuando se suba una imagen personalizada
      title: 'Nuevo Servicio',
      items: ['Precio: $0'],
      link: '/formulario',
      buttonText: 'Ver más'
    };
    this.services.push(newService);
    this.savePageContent();
  }

  removeService(index: number) {
    if (confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      this.services.splice(index, 1);
      this.savePageContent();
    }
  }

  // Método para manejar cambios de imagen del nuevo sistema edit-in-place
  async onImageChange(file: File, imageKey: string) {
    if (!this.isAdmin) {
      alert('Necesitas estar autenticado para subir archivos');
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
      
      const uploadResponse = await this.imageService.uploadImage(file, 'homepage').toPromise();

      if (uploadResponse && uploadResponse.success) {
        // Actualizar el item de media
        const item = this.mediaItems.find(m => m.id === imageKey);
        if (item) {
          // Eliminar imagen anterior si existe
          if (item.publicId) {
            try {
              await this.imageService.deleteImage(item.publicId).toPromise();
            } catch (deleteError) {
              console.warn('Error deleting previous image:', deleteError);
            }
          }

          // Actualizar con la nueva imagen
          item.src = uploadResponse.data.secure_url;
          item.publicId = uploadResponse.data.public_id;
          
          this.saveMediaToStorage();
          console.log('✅ Image updated successfully');
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen. Por favor, inténtalo de nuevo.');
    } finally {
      this.uploadingItem = null;
    }
  }

  // Método para manejar cambios de video
  async onVideoChange(file: File, videoKey: string) {
    if (!this.isAdmin) {
      alert('Necesitas estar autenticado para subir archivos');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
      return;
    }

    this.uploadingItem = videoKey;

    try {
      console.log(`🚀 Uploading video for ${videoKey}`);
      
      const uploadResponse = await this.imageService.uploadVideo(file, 'homepage-videos').toPromise();

      if (uploadResponse && uploadResponse.success) {
        // Actualizar el item de media
        const item = this.mediaItems.find(m => m.id === videoKey);
        if (item) {
          // Eliminar video anterior si existe
          if (item.publicId) {
            try {
              await this.imageService.deleteImage(item.publicId).toPromise();
            } catch (deleteError) {
              console.warn('Error deleting previous video:', deleteError);
            }
          }

          // Actualizar con el nuevo video
          item.src = uploadResponse.data.secure_url;
          item.publicId = uploadResponse.data.public_id;
          
          this.saveMediaToStorage();
          console.log('✅ Video updated successfully');
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error al subir el video. Por favor, inténtalo de nuevo.');
    } finally {
      this.uploadingItem = null;
    }
  }

  // ==========================================
  // MÉTODOS DE COMENTARIOS
  // ==========================================

  cargarComentarios() {
    console.log('🔍 Cargando comentarios desde la API...');
    this.comentariosService.getComentarios().subscribe({
      next: (response) => {
        console.log('✅ Comentarios recibidos:', response);
        // El backend ya filtra por is_approved = true, solo ordenar y limitar
        this.comentarios = response.slice(0, 6); // Mostrar solo los últimos 6
        console.log('📝 Comentarios a mostrar:', this.comentarios.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar comentarios:', error);
        this.comentarios = []; // Asegurar que sea un array vacío en caso de error
      }
    });
  }

  generarEstrellas(rating: number): string {
    const estrellasLlenas = '★'.repeat(rating);
    const estrellasVacias = '☆'.repeat(5 - rating);
    return estrellasLlenas + estrellasVacias;
  }

  enviarComentario() {
    if (!this.nuevoComentario.author_name.trim() || !this.nuevoComentario.comment_text.trim()) {
      this.mensajeComentario = 'Por favor completa todos los campos';
      return;
    }

    this.enviandoComentario = true;
    this.mensajeComentario = '';

    this.comentariosService.enviarComentario(this.nuevoComentario).subscribe({
      next: (response) => {
        this.mensajeComentario = '✅ Comentario enviado exitosamente. Será revisado antes de publicarse.';
        // Limpiar formulario
        this.nuevoComentario = {
          author_name: '',
          comment_text: '',
          rating: 5
        };
        this.enviandoComentario = false;

        // Ocultar mensaje después de 5 segundos
        setTimeout(() => {
          this.mensajeComentario = '';
        }, 5000);
      },
      error: (error) => {
        console.error('Error al enviar comentario:', error);
        this.mensajeComentario = '❌ Error al enviar el comentario. Por favor intenta nuevamente.';
        this.enviandoComentario = false;
      }
    });
  }

  // Helper to strip HTML tags for blog preview
  getPlainTextExcerpt(content: string, maxLength: number = 100): string {
    if (!content) return '';
    // Strip HTML tags
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) {
      return plainText + '...';
    }
    return plainText.substring(0, maxLength).trim() + '...';
  }
}
