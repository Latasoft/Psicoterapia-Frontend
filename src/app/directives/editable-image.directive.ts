import { Directive, ElementRef, HostListener, Input, OnInit, OnDestroy, Renderer2, Output, EventEmitter } from '@angular/core';
import { AdminModeService } from '../services/admin-mode.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appEditableImage]',
  standalone: true
})
export class EditableImageDirective implements OnInit, OnDestroy {
  @Input() imageKey!: string;
  @Input() pageId!: string;
  @Output() imageChange = new EventEmitter<File>();

  private subscription?: Subscription;
  private overlayDiv?: HTMLElement;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private adminModeService: AdminModeService
  ) {}

  ngOnInit(): void {
    this.subscription = this.adminModeService.isEditMode$.subscribe(isEditMode => {
      if (isEditMode) {
        this.enableImageEditing();
      } else {
        this.disableImageEditing();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.removeOverlay();
  }

  private enableImageEditing(): void {
    // Agregar clase de edición
    this.renderer.addClass(this.el.nativeElement, 'editable-image');
    
    // Envolver en contenedor si no está envuelto
    const parent = this.el.nativeElement.parentElement;
    if (!parent?.classList.contains('image-edit-wrapper')) {
      const wrapper = this.renderer.createElement('div');
      this.renderer.addClass(wrapper, 'image-edit-wrapper');
      this.renderer.insertBefore(parent, wrapper, this.el.nativeElement);
      this.renderer.appendChild(wrapper, this.el.nativeElement);
    }
  }

  private disableImageEditing(): void {
    this.renderer.removeClass(this.el.nativeElement, 'editable-image');
    this.removeOverlay();
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.adminModeService.isEditMode() && !this.overlayDiv) {
      this.showOverlay();
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.overlayDiv) {
      this.removeOverlay();
    }
  }

  private showOverlay(): void {
    const wrapper = this.el.nativeElement.parentElement;
    
    // Crear overlay
    this.overlayDiv = this.renderer.createElement('div');
    this.renderer.addClass(this.overlayDiv, 'image-edit-overlay');
    
    // Botón de cambiar imagen
    const changeBtn = this.renderer.createElement('button');
    changeBtn.innerHTML = '<i class="fas fa-edit"></i> Cambiar';
    this.renderer.addClass(changeBtn, 'image-edit-btn');
    this.renderer.addClass(changeBtn, 'change-btn');
    this.renderer.listen(changeBtn, 'click', (e) => {
      e.stopPropagation();
      this.triggerFileInput();
    });
    
    // Botón de eliminar imagen (opcional)
    const deleteBtn = this.renderer.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    this.renderer.addClass(deleteBtn, 'image-edit-btn');
    this.renderer.addClass(deleteBtn, 'delete-btn');
    this.renderer.listen(deleteBtn, 'click', (e) => {
      e.stopPropagation();
      this.deleteImage();
    });
    
    this.renderer.appendChild(this.overlayDiv, changeBtn);
    this.renderer.appendChild(this.overlayDiv, deleteBtn);
    this.renderer.appendChild(wrapper, this.overlayDiv);
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
    this.renderer.setAttribute(input, 'accept', 'image/*');
    this.renderer.setStyle(input, 'display', 'none');
    
    this.renderer.listen(input, 'change', (event: any) => {
      const file = event.target.files?.[0];
      if (file) {
        this.imageChange.emit(file);
        
        // Preview inmediato
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.renderer.setAttribute(this.el.nativeElement, 'src', e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
    
    input.click();
  }

  private deleteImage(): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      // Emitir evento o manejar eliminación
      console.log('Eliminar imagen:', this.imageKey);
      // Aquí puedes implementar la lógica de eliminación
    }
  }
}
