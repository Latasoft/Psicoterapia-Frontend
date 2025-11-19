import { Directive, ElementRef, HostListener, Input, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { AdminModeService } from '../services/admin-mode.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appEditableContent]',
  standalone: true
})
export class EditableContentDirective implements OnInit, OnDestroy {
  @Input() pageId!: string;
  @Input() contentId!: string;
  @Input() contentType: 'text' | 'html' = 'text';

  private subscription?: Subscription;
  private originalValue: string = '';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private adminModeService: AdminModeService
  ) {}

  ngOnInit(): void {
    // Guardar valor original
    this.originalValue = this.el.nativeElement.innerText;

    // Suscribirse a cambios en el modo edición
    this.subscription = this.adminModeService.isEditMode$.subscribe(isEditMode => {
      if (isEditMode) {
        this.enableEditing();
      } else {
        this.disableEditing();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private enableEditing(): void {
    // Hacer el elemento editable
    this.renderer.setAttribute(this.el.nativeElement, 'contenteditable', 'true');
    this.renderer.addClass(this.el.nativeElement, 'editable-zone');
    this.renderer.addClass(this.el.nativeElement, 'edit-mode-active');
  }

  private disableEditing(): void {
    this.renderer.removeAttribute(this.el.nativeElement, 'contenteditable');
    this.renderer.removeClass(this.el.nativeElement, 'editable-zone');
    this.renderer.removeClass(this.el.nativeElement, 'edit-mode-active');
  }

  @HostListener('blur')
  onBlur(): void {
    if (this.adminModeService.isEditMode()) {
      const newValue = this.contentType === 'html' 
        ? this.el.nativeElement.innerHTML 
        : this.el.nativeElement.innerText;

      // Solo guardar si el valor cambió
      if (newValue !== this.originalValue) {
        this.adminModeService.queueSave(this.pageId, this.contentId, newValue);
        this.originalValue = newValue;
      }
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Prevenir saltos de línea en títulos (h1, h2, etc)
    if (event.key === 'Enter' && this.el.nativeElement.tagName.match(/^H[1-6]$/)) {
      event.preventDefault();
      this.el.nativeElement.blur(); // Terminar edición
    }

    // Guardar con Cmd/Ctrl + S
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      this.adminModeService.saveNow();
    }

    // Cancelar con Escape
    if (event.key === 'Escape') {
      this.el.nativeElement.innerText = this.originalValue;
      this.el.nativeElement.blur();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    // Prevenir formato al pegar (solo texto plano)
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain');
    if (text) {
      document.execCommand('insertText', false, text);
    }
  }
}
