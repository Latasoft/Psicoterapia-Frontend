import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service';
import { PageContentService } from '../../services/page-content.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

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
    imports: [RouterModule, FormsModule, CommonModule],
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
  services: any[] = [];
  conveniosInfo: any = {};

  constructor(
    private blogService: BlogService,
    private authService: AuthService,
    private imageService: ImageService,
    private pageContentService: PageContentService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.cargarUltimosBlogs();
    this.checkAdminStatus();
    this.loadMediaFromStorage();
    this.loadPageContent();
    this.testImageService(); // Añadir esta línea
  }

  cargarUltimosBlogs() {
    this.blogService.obtenerBlogs().pipe(
      catchError(error => {
        this.errorMessage = 'Error al cargar los blogs';
        console.error(error);
        return of([]);
      })
    ).subscribe((data) => {
      this.ultimosBlogs = data
        .sort((a: any, b: any) => b.fecha._seconds - a.fecha._seconds)
        .slice(0, 4);
    });
  }

  checkAdminStatus() {
      this.isAdmin = this.authService.isLoggedIn();
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
      this.uploadMedia(itemId);
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
    const item = this.mediaItems.find(m => m.id === itemId);
    return item ? item.src : '';
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
    this.pageContentService.getPageContent('inicio').subscribe({
      next: (data) => {
        this.contactInfo = data.contactInfo || { title: 'Contacto', items: [] };
        this.tarotText = data.tarotText || { content: '' };
        this.services = data.services || [];
        this.conveniosInfo = data.conveniosInfo || { title: 'Convenios', description: '' };
      },
      error: (error) => {
        console.error('Error al cargar contenido:', error);
        // Cargar valores por defecto en caso de error
        this.setDefaultContent();
      }
    });
  }

  // Establecer contenido por defecto
  setDefaultContent() {
    this.contactInfo = {
      title: 'Contacto',
      items: [
        '+56 9 9473 9587',
        'emhpsicoterapiaonlinegmail.com',
        'contactoemhpsicoterapiaonline.com',
        'Avenida La Paz, Queilen, Chiloé, Chile'
      ]
    };
    this.tarotText = {
      content: 'Descubre las respuestas que el universo tiene para ti. El tarot puede iluminar tu camino y brindarte la claridad que necesitas para avanzar con confianza'
    };
    this.services = [
      {
        imageKey: 'service1-image',
        title: 'Psicoterapia clínica individual online',
        items: ['$40.000'],
        link: '/formulario',
        buttonText: 'Agendar'
      },
      {
        imageKey: 'service2-image',
        title: 'Taller de Duelo',
        items: ['$70.000', 'Plazas disponibles'],
        link: '/taller',
        buttonText: 'Ver mas'
      }
    ];
    this.conveniosInfo = {
      title: 'Convenios',
      description: 'Contamos con convenios de reembolso de boletas con Banmédica y Vida 3...'
    };
  }

  // Guardar contenido de la página
  savePageContent() {
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
      title: 'Nuevo Servicio',
      items: ['Precio'],
      link: '#',
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
}
