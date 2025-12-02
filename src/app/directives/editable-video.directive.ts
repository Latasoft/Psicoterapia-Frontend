import { Directive, ElementRef, HostListener, Input, OnInit, OnDestroy, Renderer2, Output, EventEmitter } from '@angular/core';
import { AdminModeService } from '../services/admin-mode.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appEditableVideo]',
  standalone: true
})
export class EditableVideoDirective implements OnInit, OnDestroy {
  @Input() videoKey!: string;
  @Input() pageId!: string;
  @Output() videoChange = new EventEmitter<File>();

  private subscription?: Subscription;
  private overlayDiv?: HTMLElement;
  private isEditMode = false;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private adminModeService: AdminModeService
  ) {}

  ngOnInit(): void {
    this.subscription = this.adminModeService.isEditMode$.subscribe(isEditMode => {
      this.isEditMode = isEditMode;
      if (isEditMode) {
        this.enableVideoEditing();
      } else {
        this.disableVideoEditing();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.removeOverlay();
  }

  private enableVideoEditing(): void {
    this.renderer.addClass(this.el.nativeElement, 'editable-video');
    
    // Buscar o crear wrapper
    const parent = this.el.nativeElement.parentElement;
    let wrapper = parent;
    
    if (!parent?.classList.contains('video-edit-wrapper')) {
      wrapper = this.renderer.createElement('div');
      this.renderer.addClass(wrapper, 'video-edit-wrapper');
      this.renderer.insertBefore(parent, wrapper, this.el.nativeElement);
      this.renderer.appendChild(wrapper, this.el.nativeElement);
    }
    
    // Crear overlay si no existe (puede haber sido removido anteriormente)
    if (!this.overlayDiv) {
      this.createOverlay(wrapper);
    }
  }

  private disableVideoEditing(): void {
    this.renderer.removeClass(this.el.nativeElement, 'editable-video');
    this.removeOverlay();
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.isEditMode && this.overlayDiv) {
      this.renderer.addClass(this.overlayDiv, 'visible');
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.overlayDiv) {
      this.renderer.removeClass(this.overlayDiv, 'visible');
    }
  }

  private createOverlay(wrapper: HTMLElement): void {
    this.overlayDiv = this.renderer.createElement('div');
    this.renderer.addClass(this.overlayDiv, 'video-edit-overlay');
    
    const changeBtn = this.renderer.createElement('button');
    changeBtn.innerHTML = '🎬 Cambiar Video';
    this.renderer.addClass(changeBtn, 'video-edit-btn');
    this.renderer.addClass(changeBtn, 'change-btn');
    this.renderer.listen(changeBtn, 'click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.triggerFileInput();
    });
    
    this.renderer.appendChild(this.overlayDiv, changeBtn);
    this.renderer.appendChild(wrapper, this.overlayDiv);
    
    this.renderer.listen(this.overlayDiv, 'mouseenter', () => {
      this.renderer.addClass(this.overlayDiv!, 'visible');
    });
  }

  private removeOverlay(): void {
    if (this.overlayDiv) {
      this.renderer.removeChild(this.overlayDiv.parentElement, this.overlayDiv);
      this.overlayDiv = undefined;
    }
  }

  private triggerFileInput(): void {
    const input = this.renderer.createElement('input');
    this.renderer.setAttribute(input, 'type', 'file');
    this.renderer.setAttribute(input, 'accept', 'video/*');
    this.renderer.setStyle(input, 'display', 'none');
    
    this.renderer.listen(input, 'change', (event: any) => {
      const file = event.target.files?.[0];
      if (file) {
        // Verificar tamaño (max 50MB para videos)
        if (file.size > 50 * 1024 * 1024) {
          alert('El video es demasiado grande. Máximo 50MB.');
          return;
        }
        
        this.videoChange.emit(file);
        
        // Preview inmediato
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const video = this.el.nativeElement;
          const source = video.querySelector('source');
          if (source) {
            this.renderer.setAttribute(source, 'src', e.target.result);
            video.load(); // Recargar el video
          }
        };
        reader.readAsDataURL(file);
      }
    });
    
    input.click();
  }
}
