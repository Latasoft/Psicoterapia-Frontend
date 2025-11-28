import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rich-text-editor.component.html',
  styleUrls: ['./rich-text-editor.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true
    }
  ]
})
export class RichTextEditorComponent implements ControlValueAccessor {
  @Input() placeholder = 'Escribe el contenido del blog...';
  @Input() minHeight = '300px';
  
  content = '';
  disabled = false;
  showImageModal = false;
  imageUrl = '';
  
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  // Formateo de texto
  execCommand(command: string, value: string | null = null): void {
    document.execCommand(command, false, value || undefined);
    this.updateContent();
  }

  // Insertar imagen
  openImageModal(): void {
    this.showImageModal = true;
  }

  insertImage(): void {
    if (this.imageUrl.trim()) {
      this.execCommand('insertImage', this.imageUrl);
      this.imageUrl = '';
      this.showImageModal = false;
    }
  }

  cancelImageModal(): void {
    this.imageUrl = '';
    this.showImageModal = false;
  }

  // Actualizar contenido
  onContentChange(event: Event): void {
    const target = event.target as HTMLElement;
    this.content = target.innerHTML;
    this.onChange(this.content);
    this.onTouched();
  }

  // Manejar paste para procesar el contenido pegado
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    // Intentar obtener HTML primero, si no texto plano
    let pastedContent = clipboardData.getData('text/html');
    
    if (!pastedContent) {
      // Si no hay HTML, usar texto plano y convertir saltos de línea
      const plainText = clipboardData.getData('text/plain');
      pastedContent = plainText.replace(/\n/g, '<br>');
    }

    // Insertar el contenido en el cursor
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    const div = document.createElement('div');
    div.innerHTML = pastedContent;
    
    const frag = document.createDocumentFragment();
    let node;
    while ((node = div.firstChild)) {
      frag.appendChild(node);
    }
    
    range.insertNode(frag);
    
    // Mover el cursor al final del contenido pegado
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Actualizar el contenido
    this.updateContent();
  }

  private updateContent(): void {
    const editor = document.querySelector('.editor-content') as HTMLElement;
    if (editor) {
      this.content = editor.innerHTML;
      this.onChange(this.content);
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.content = value || '';
    const editor = document.querySelector('.editor-content') as HTMLElement;
    if (editor && editor.innerHTML !== this.content) {
      editor.innerHTML = this.content;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
