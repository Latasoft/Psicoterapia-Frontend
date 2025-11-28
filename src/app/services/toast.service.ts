import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  constructor() {}

  /**
   * Muestra un mensaje de éxito (verde)
   */
  success(message: string, duration: number = 3000) {
    this.show(message, 'success', duration);
  }

  /**
   * Muestra un mensaje de error (rojo)
   */
  error(message: string, duration: number = 5000) {
    this.show(message, 'error', duration);
  }

  /**
   * Muestra un mensaje informativo (azul)
   */
  info(message: string, duration: number = 3000) {
    this.show(message, 'info', duration);
  }

  /**
   * Muestra un mensaje de advertencia (amarillo)
   */
  warning(message: string, duration: number = 4000) {
    this.show(message, 'warning', duration);
  }

  /**
   * Muestra un toast genérico
   */
  private show(message: string, type: Toast['type'], duration: number) {
    console.log('[TOAST] Mostrando:', { message, type, duration });
    
    if (!message || message.trim() === '') {
      console.warn('[TOAST] Mensaje vacío, no se mostrará toast');
      return;
    }
    
    const id = this.generateId();
    const toast: Toast = { id, message, type, duration };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);
    
    console.log('[TOAST] Toast agregado. Total activos:', currentToasts.length + 1);

    // Auto-remover después de la duración especificada
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  /**
   * Remueve un toast específico
   */
  remove(id: string) {
    const currentToasts = this.toastsSubject.value;
    const updatedToasts = currentToasts.filter(t => t.id !== id);
    this.toastsSubject.next(updatedToasts);
  }

  /**
   * Remueve todos los toasts
   */
  clear() {
    this.toastsSubject.next([]);
  }

  /**
   * Genera un ID único para cada toast
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
