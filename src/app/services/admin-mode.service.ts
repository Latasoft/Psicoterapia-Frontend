import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, debounceTime } from 'rxjs';
import { PageContentService } from './page-content.service';
import { ToastService } from './toast.service';

interface PendingChange {
  pageId: string;
  contentId: string;
  value: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminModeService {
  private editMode$ = new BehaviorSubject<boolean>(false);
  private saveQueue = new Map<string, PendingChange>();
  private saveSubject = new Subject<void>();
  private pendingCount$ = new BehaviorSubject<number>(0);
  private saving$ = new BehaviorSubject<boolean>(false);
  private lastSaveStatus$ = new BehaviorSubject<'success' | 'error' | null>(null);
  private contentCache = new Map<string, any>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutos

  // Observables públicos
  public isEditMode$ = this.editMode$.asObservable();
  public pendingChangesCount$ = this.pendingCount$.asObservable();
  public isSaving$ = this.saving$.asObservable();
  public saveStatus$ = this.lastSaveStatus$.asObservable();

  constructor(
    private pageContentService: PageContentService,
    private toastService: ToastService
  ) {
    // Configurar auto-guardado con debounce de 3 segundos
    this.saveSubject.pipe(
      debounceTime(3000)
    ).subscribe(() => {
      this.flushSaves();
    });

    // Guardar en localStorage como backup
    this.saveToLocalStorage();
    
    // Cargar cache de localStorage al iniciar
    this.loadCacheFromStorage();
  }

  /**
   * Obtiene contenido desde cache si está disponible
   */
  getCachedContent(pageId: string): any | null {
    const cached = this.contentCache.get(pageId);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.content;
    }
    return null;
  }

  /**
   * Guarda contenido en cache
   */
  setCachedContent(pageId: string, content: any): void {
    this.contentCache.set(pageId, {
      content,
      timestamp: Date.now()
    });
    this.saveCacheToStorage();
  }

  /**
   * Obtiene el estado actual del modo edición
   */
  isEditMode(): boolean {
    return this.editMode$.value;
  }

  /**
   * Carga cache desde localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem('page_content_cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          if (value && (Date.now() - value.timestamp) < this.cacheExpiry) {
            this.contentCache.set(key, value);
          }
        });
      }
    } catch (error) {
      console.error('Error loading cache from storage:', error);
    }
  }

  /**
   * Guarda cache en localStorage
   */
  private saveCacheToStorage(): void {
    try {
      const cacheObj: any = {};
      this.contentCache.forEach((value, key) => {
        cacheObj[key] = value;
      });
      localStorage.setItem('page_content_cache', JSON.stringify(cacheObj));
    } catch (error) {
      console.error('Error saving cache to storage:', error);
    }
  }

  toggleEditMode(): void {
    const newMode = !this.editMode$.value;
    this.editMode$.next(newMode);
    
    if (!newMode && this.saveQueue.size > 0) {
      // Al salir del modo edición, guardar cambios pendientes
      this.flushSaves();
    }
  }

  /**
   * Agrega un cambio a la cola de guardado
   */
  queueSave(pageId: string, contentId: string, value: any): void {
    const key = `${pageId}:${contentId}`;
    
    this.saveQueue.set(key, {
      pageId,
      contentId,
      value,
      timestamp: Date.now()
    });

    this.pendingCount$.next(this.saveQueue.size);
    this.saveSubject.next(); // Trigger debounced save
  }

  /**
   * Guarda todos los cambios pendientes al backend usando batch update
   */
  async flushSaves(): Promise<void> {
    if (this.saveQueue.size === 0) return;

    this.saving$.next(true);
    
    try {
      // Agrupar cambios por pageId
      const changesByPage = new Map<string, any>();
      
      this.saveQueue.forEach((change) => {
        if (!changesByPage.has(change.pageId)) {
          changesByPage.set(change.pageId, {});
        }
        changesByPage.get(change.pageId)![change.contentId] = change.value;
      });

      // Guardar cada página usando el endpoint batch
      const savePromises = Array.from(changesByPage.entries()).map(([pageId, updates]) => {
        return this.pageContentService.batchUpdateContent(pageId, updates).toPromise();
      });

      await Promise.all(savePromises);

      // Actualizar cache con los nuevos valores
      changesByPage.forEach((updates, pageId) => {
        const cached = this.getCachedContent(pageId) || {};
        const updatedContent = { ...cached, ...updates };
        this.setCachedContent(pageId, updatedContent);
      });

      // Limpiar cola después de guardar exitosamente
      this.saveQueue.clear();
      this.pendingCount$.next(0);
      this.lastSaveStatus$.next('success');
      
      // Mostrar notificación de éxito
      const changesCount = Array.from(changesByPage.values()).reduce((acc, updates) => acc + Object.keys(updates).length, 0);
      this.toastService.success(`${changesCount} cambio${changesCount > 1 ? 's' : ''} guardado${changesCount > 1 ? 's' : ''} exitosamente`);
      
      // Auto-ocultar status después de 3 segundos
      setTimeout(() => {
        this.lastSaveStatus$.next(null);
      }, 3000);

      console.log('✅ Cambios guardados exitosamente');
    } catch (error) {
      console.error('❌ Error al guardar cambios:', error);
      this.lastSaveStatus$.next('error');
      
      // Mostrar notificación de error
      this.toastService.error('Error al guardar cambios. Por favor, intenta nuevamente.');
      
      setTimeout(() => {
        this.lastSaveStatus$.next(null);
      }, 5000);
    } finally {
      this.saving$.next(false);
    }
  }

  /**
   * Guarda cambios en localStorage como backup
   */
  private saveToLocalStorage(): void {
    this.editMode$.subscribe(() => {
      if (this.saveQueue.size > 0) {
        const backup = Array.from(this.saveQueue.entries());
        localStorage.setItem('admin-changes-backup', JSON.stringify(backup));
      } else {
        localStorage.removeItem('admin-changes-backup');
      }
    });
  }

  /**
   * Restaura cambios desde localStorage
   */
  restoreFromLocalStorage(): void {
    const backup = localStorage.getItem('admin-changes-backup');
    if (backup) {
      try {
        const entries = JSON.parse(backup);
        this.saveQueue = new Map(entries);
        this.pendingCount$.next(this.saveQueue.size);
        console.log(`📦 Restaurados ${this.saveQueue.size} cambios desde backup`);
      } catch (error) {
        console.error('Error restaurando backup:', error);
      }
    }
  }

  /**
   * Descarta todos los cambios pendientes
   */
  discardChanges(): void {
    this.saveQueue.clear();
    this.pendingCount$.next(0);
    localStorage.removeItem('admin-changes-backup');
    console.log('🗑️ Cambios descartados');
  }

  /**
   * Fuerza guardado inmediato sin debounce
   */
  saveNow(): void {
    this.flushSaves();
  }
}
