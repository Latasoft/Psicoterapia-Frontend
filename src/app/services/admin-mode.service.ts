import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, debounceTime } from 'rxjs';
import { PageContentService } from './page-content.service';

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

  // Observables públicos
  public isEditMode$ = this.editMode$.asObservable();
  public pendingChangesCount$ = this.pendingCount$.asObservable();
  public isSaving$ = this.saving$.asObservable();
  public saveStatus$ = this.lastSaveStatus$.asObservable();

  constructor(private pageContentService: PageContentService) {
    // Configurar auto-guardado con debounce de 3 segundos
    this.saveSubject.pipe(
      debounceTime(3000)
    ).subscribe(() => {
      this.flushSaves();
    });

    // Guardar en localStorage como backup
    this.saveToLocalStorage();
  }

  toggleEditMode(): void {
    const newMode = !this.editMode$.value;
    this.editMode$.next(newMode);
    
    if (!newMode && this.saveQueue.size > 0) {
      // Al salir del modo edición, guardar cambios pendientes
      this.flushSaves();
    }
  }

  isEditMode(): boolean {
    return this.editMode$.value;
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

      // Limpiar cola después de guardar exitosamente
      this.saveQueue.clear();
      this.pendingCount$.next(0);
      this.lastSaveStatus$.next('success');
      
      // Auto-ocultar status después de 3 segundos
      setTimeout(() => {
        this.lastSaveStatus$.next(null);
      }, 3000);

      console.log('✅ Cambios guardados exitosamente');
    } catch (error) {
      console.error('❌ Error al guardar cambios:', error);
      this.lastSaveStatus$.next('error');
      
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
