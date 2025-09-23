import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebpayService } from '../../services/webpay.service';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-webpay-return',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './webpay-return.component.html',
  styles: [`
    .webpay-return-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background-color: #f5f5f5;
    }

    .result-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      max-width: 500px;
      width: 100%;
    }

    .result-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }

    .result-icon.success {
      color: #4CAF50;
    }

    .result-icon.error {
      color: #f44336;
    }

    .transaction-details {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: left;
    }

    .actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 30px;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.3s;
    }

    .btn-primary {
      background-color: #2196F3;
      color: white;
    }

    .btn-secondary {
      background-color: #4CAF50;
      color: white;
    }

    .btn:hover {
      opacity: 0.9;
    }

    .loading {
      text-align: center;
      color: #666;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class WebpayReturnComponent implements OnInit {
  loading = true;
  success = false;
  transactionResult: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private webpayService: WebpayService
  ) {}

  async ngOnInit() {
    try {
      // Obtener el token de la URL
      const token = this.route.snapshot.queryParams['token_ws'];
      
      if (!token) {
        this.handleError('Token no encontrado');
        return;
      }

      // Confirmar la transacción
      const result = await lastValueFrom(
        this.webpayService.commitTransaction(token)
      );

      this.transactionResult = result;
      this.success = result.responseCode === 0; // 0 = aprobada
      
      // Limpiar localStorage
      localStorage.removeItem('webpay_transaction');

    } catch (error) {
      console.error('Error al procesar retorno de Webpay:', error);
      this.handleError('Error al procesar el pago');
    } finally {
      this.loading = false;
    }
  }

  private handleError(message: string) {
    this.success = false;
    this.loading = false;
    console.error(message);
  }

  volverInicio() {
    this.router.navigate(['/']);
  }

  nuevaCita() {
    this.router.navigate(['/formulario']);
  }
}