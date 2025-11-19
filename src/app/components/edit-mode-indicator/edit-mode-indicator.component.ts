import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminModeService } from '../../services/admin-mode.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-edit-mode-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './edit-mode-indicator.component.html',
  styleUrls: ['./edit-mode-indicator.component.css']
})
export class EditModeIndicatorComponent implements OnInit {
  isEditMode = false;
  isAdmin = false;
  pendingChanges = 0;
  isSaving = false;
  saveStatus: 'success' | 'error' | null = null;

  constructor(
    public adminModeService: AdminModeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Verificar si es admin
    this.isAdmin = this.authService.isAdmin();

    // Suscribirse a cambios
    this.adminModeService.isEditMode$.subscribe(mode => {
      this.isEditMode = mode;
    });

    this.adminModeService.pendingChangesCount$.subscribe(count => {
      this.pendingChanges = count;
    });

    this.adminModeService.isSaving$.subscribe(saving => {
      this.isSaving = saving;
    });

    this.adminModeService.saveStatus$.subscribe(status => {
      this.saveStatus = status;
    });
  }

  toggleEditMode(): void {
    this.adminModeService.toggleEditMode();
  }

  saveNow(): void {
    this.adminModeService.saveNow();
  }

  discardChanges(): void {
    if (confirm('¿Estás seguro de que quieres descartar todos los cambios?')) {
      this.adminModeService.discardChanges();
    }
  }
}
