import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WebpayService } from '../../services/webpay.service';

@Component({
  selector: 'app-webpay-return',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './webpay-return.component.html',
  styleUrls: ['./webpay-return.component.css']
})
export class WebpayReturnComponent implements OnInit {
  // Estados
  loading = true;
  pagoExitoso = false;
  pagoRechazado = false;
  error = false;
  
  // Datos de la transacción
  buyOrder = '';
  amount = 0;
  authorizationCode = '';
  transactionDate = '';
  
  // Datos de las citas creadas
  citasCreadas: any[] = [];
  paquete: any = null;
  
  // Mensaje de error
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private webpayService: WebpayService
  ) {}

  async ngOnInit() {
    console.log('\n========================================');
    console.log('🔄 RETORNO DESDE WEBPAY');
    console.log('========================================');

    try {
      // Obtener el token de la URL
      const token = this.route.snapshot.queryParams['token_ws'];
      
      console.log('Token recibido:', token);

      if (!token) {
        this.handleError('Token no encontrado en la URL');
        return;
      }

      // Verificar la transacción
      console.log('Verificando transacción con el backend...');

      this.webpayService.verifyTransaction(token).subscribe({
        next: (response) => {
          console.log('Respuesta del backend:', response);

          this.loading = false;

          if (response.success && response.approved) {
            // PAGO EXITOSO
            console.log('✅ PAGO EXITOSO');
            
            this.pagoExitoso = true;
            this.buyOrder = response.buyOrder || '';
            this.amount = response.amount || 0;
            this.authorizationCode = response.authorizationCode || '';
            this.transactionDate = response.transactionDate || '';
            this.citasCreadas = response.citas || [];
            this.paquete = response.paquete || null;

            // Limpiar localStorage
            localStorage.removeItem('webpay_buy_order');
            localStorage.removeItem('webpay_timestamp');

            console.log(`${this.citasCreadas.length} citas creadas`);
            
          } else if (response.success && !response.approved) {
            // PAGO RECHAZADO
            console.log('❌ PAGO RECHAZADO');
            
            this.pagoRechazado = true;
            this.buyOrder = response.buyOrder || '';
            this.amount = response.amount || 0;
            this.errorMessage = response.message || 'Pago rechazado por el banco';
            
          } else {
            // ERROR DESCONOCIDO
            this.handleError(response.message || 'Error desconocido al procesar el pago');
          }
        },
        error: (err) => {
          console.error('Error al verificar transacción:', err);
          this.handleError(
            err.error?.error || 
            err.error?.message || 
            'Error al comunicarse con el servidor'
          );
        }
      });

    } catch (error: any) {
      console.error('Error inesperado:', error);
      this.handleError('Error inesperado al procesar el retorno de Webpay');
    }

    console.log('========================================\n');
  }

  private handleError(message: string) {
    console.error('ERROR:', message);
    this.loading = false;
    this.error = true;
    this.errorMessage = message;
  }

  volverInicio() {
    this.router.navigate(['/']);
  }

  verMisCitas() {
    this.router.navigate(['/mis-citas']);
  }

  nuevaReserva() {
    this.router.navigate(['/tratamientos']);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    try {
      const date = new Date(fecha);
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${dias[date.getDay()]} ${date.getDate()} ${meses[date.getMonth()]}`;
    } catch {
      return fecha;
    }
  }

  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(monto);
  }
}
