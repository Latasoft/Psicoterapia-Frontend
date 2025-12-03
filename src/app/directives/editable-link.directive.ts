import { Directive, ElementRef, HostListener, Input, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { AdminModeService } from '../services/admin-mode.service';
import { PageContentService } from '../services/page-content.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appEditableLink]',
  standalone: true
})
export class EditableLinkDirective implements OnInit, OnDestroy {
  @Input() pageId!: string;
  @Input() linkKey!: string;

  private subscription?: Subscription;
  private originalUrl: string = '';
  private overlayDiv?: HTMLElement;
  private isLoading = true;
  private isEditMode = false;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private adminModeService: AdminModeService,
    private pageContentService: PageContentService
  ) {}

  ngOnInit(): void {
    // Agregar clase de loading
    this.renderer.addClass(this.el.nativeElement, 'link-loading');
    
    // Cargar URL desde la BD
    this.loadUrl();

    // Suscribirse a cambios en el modo edición
    this.subscription = this.adminModeService.isEditMode$.subscribe(isEditMode => {
      this.isEditMode = isEditMode;
      if (isEditMode) {
        this.enableEditing();
      } else {
        this.disableEditing();
      }
    });
  }

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    // Prevenir navegación si está en modo edición
    if (this.isEditMode) {
      event.preventDefault();
      event.stopPropagation();
      this.openEditDialog();
    }
  }

  private loadUrl(): void {
    // Intentar cargar desde cache primero
    const cached = this.adminModeService.getCachedContent(this.pageId);
    
    if (cached && cached[this.linkKey]) {
      // Aplicar URL cacheada inmediatamente
      this.applyUrl(cached[this.linkKey]);
      this.showLink();
      
      // Seguir cargando desde BD en background para actualizar
      this.loadFromDatabase(false);
    } else {
      // No hay cache, cargar desde BD
      this.loadFromDatabase(true);
    }
  }

  private loadFromDatabase(showAfterLoad: boolean): void {
    this.pageContentService.getPageContent(this.pageId).subscribe({
      next: (content) => {
        // Guardar en cache
        this.adminModeService.setCachedContent(this.pageId, content);
        
        // Buscar el valor guardado para este linkKey
        if (content && content[this.linkKey]) {
          this.applyUrl(content[this.linkKey]);
        } else {
          // Si no hay valor guardado, usar el del HTML
          this.originalUrl = this.el.nativeElement.href || this.el.nativeElement.getAttribute('href') || '';
        }
        
        if (showAfterLoad) {
          this.showLink();
        }
      },
      error: (err) => {
        console.error(`Error loading link for ${this.linkKey}:`, err);
        // En caso de error, usar el valor del HTML y mostrar
        this.originalUrl = this.el.nativeElement.href || this.el.nativeElement.getAttribute('href') || '';
        
        if (showAfterLoad) {
          this.showLink();
        }
      }
    });
  }

  private applyUrl(url: string): void {
    this.renderer.setAttribute(this.el.nativeElement, 'href', url);
    this.originalUrl = url;
  }

  private showLink(): void {
    this.isLoading = false;
    this.renderer.removeClass(this.el.nativeElement, 'link-loading');
    this.renderer.addClass(this.el.nativeElement, 'link-loaded');
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.removeOverlay();
  }

  private enableEditing(): void {
    // Agregar indicador visual de que es editable
    this.renderer.addClass(this.el.nativeElement, 'editable-link');
    
    // Crear overlay con botón de editar
    const parent = this.el.nativeElement.parentElement;
    if (!parent?.classList.contains('link-edit-wrapper') && !this.overlayDiv) {
      this.createOverlay(parent);
    }
  }

  private disableEditing(): void {
    this.renderer.removeClass(this.el.nativeElement, 'editable-link');
    this.removeOverlay();
  }

  private createOverlay(parent: HTMLElement): void {
    // Crear wrapper si no existe
    let wrapper = parent.querySelector('.link-edit-wrapper');
    if (!wrapper) {
      wrapper = this.renderer.createElement('div');
      this.renderer.addClass(wrapper, 'link-edit-wrapper');
      this.renderer.setStyle(wrapper, 'position', 'relative');
      this.renderer.setStyle(wrapper, 'display', 'inline-block');
      
      // Insertar wrapper
      this.renderer.insertBefore(parent, wrapper, this.el.nativeElement);
      this.renderer.appendChild(wrapper, this.el.nativeElement);
    }

    // Crear overlay
    this.overlayDiv = this.renderer.createElement('div');
    this.renderer.addClass(this.overlayDiv, 'link-edit-overlay');
    
    const editBtn = this.renderer.createElement('button');
    editBtn.innerHTML = '🔗 Editar URL';
    this.renderer.addClass(editBtn, 'link-edit-btn');
    
    this.renderer.listen(editBtn, 'click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.openEditDialog();
    });
    
    this.renderer.appendChild(this.overlayDiv, editBtn);
    this.renderer.appendChild(wrapper, this.overlayDiv);
  }

  private removeOverlay(): void {
    if (this.overlayDiv) {
      this.renderer.removeChild(this.overlayDiv.parentElement, this.overlayDiv);
      this.overlayDiv = undefined;
    }
  }

  private openEditDialog(): void {
    const currentUrl = this.el.nativeElement.getAttribute('href') || '';
    const newUrl = prompt('Ingresa la nueva URL:', currentUrl);
    
    if (newUrl !== null && newUrl !== currentUrl) {
      // Validar que sea una URL válida
      if (this.isValidUrl(newUrl)) {
        this.applyUrl(newUrl);
        this.adminModeService.queueSave(this.pageId, this.linkKey, newUrl);
      } else {
        alert('URL inválida. Debe comenzar con http://, https://, mailto: o tel:');
      }
    }
  }

  private isValidUrl(url: string): boolean {
    // Permitir URLs web, mailto y tel
    if (url.startsWith('mailto:') || url.startsWith('tel:')) {
      return true;
    }
    
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.adminModeService.isEditMode() && this.overlayDiv) {
      this.renderer.addClass(this.overlayDiv, 'visible');
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.overlayDiv) {
      this.renderer.removeClass(this.overlayDiv, 'visible');
    }
  }
}
