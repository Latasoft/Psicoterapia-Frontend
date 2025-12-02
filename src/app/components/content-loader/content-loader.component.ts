import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminModeService } from '../../services/admin-mode.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-content-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="content-loader-overlay" *ngIf="isLoading$ | async">
      <div class="loader-spinner"></div>
      <p class="loader-text">Cargando contenido...</p>
    </div>
  `,
  styles: [`
    .content-loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .loader-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #2196F3;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loader-text {
      margin-top: 20px;
      color: #333;
      font-size: 16px;
      font-weight: 500;
    }
  `]
})
export class ContentLoaderComponent implements OnInit {
  isLoading$: Observable<boolean>;

  constructor(private adminModeService: AdminModeService) {
    this.isLoading$ = this.adminModeService.isSaving$;
  }

  ngOnInit(): void {}
}
