import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

// ==========================================
// INTERFACES
// ==========================================

export interface IniciarTransaccionWebpayRequest {
  // Datos del paquete
  paqueteId: string;
  
  // Sesiones seleccionadas
  sesiones: {
    fecha: string;
    horaInicio: string;
    horaFin: string;
  }[];
  
  // Datos del paciente
  rutPaciente: string;
  nombrePaciente: string;
  emailPaciente: string;
  telefonoPaciente: string;
  notas?: string;
  direccion?: string;
  comuna?: string;
  
  // Datos de la transacción
  modalidad: string;
  monto: number;
}

export interface IniciarTransaccionWebpayResponse {
  success: boolean;
  token: string;
  url: string;
  buyOrder: string;
  message?: string;
}

export interface ConfirmarTransaccionWebpayResponse {
  success: boolean;
  approved: boolean;
  message: string;
  
  // Datos de la transacción
  vci?: string;
  amount?: number;
  status?: string;
  buyOrder?: string;
  sessionId?: string;
  authorizationCode?: string;
  transactionDate?: string;
  
  // Datos de las citas creadas (si el pago fue exitoso)
  citas?: {
    id: string;
    fecha: string;
    hora: string;
    duracion: number;
  }[];
  
  paquete?: {
    nombre: string;
    sesiones: number;
    precio: number;
  };
}

/**
 * Servicio para gestionar pagos con Webpay Plus (Transbank)
 * 
 * Flujo:
 * 1. initTransaction() - Inicia transacción y redirige a Webpay
 * 2. Usuario paga en Transbank
 * 3. Transbank redirige a /webpay-return con token
 * 4. verifyTransaction() - Confirma pago y crea citas
 */
@Injectable({
  providedIn: 'root'
})
export class WebpayService {
  private apiUrl = `${environment.apiUrl}/api/webpay`;

  constructor(private http: HttpClient) {}

  /**
   * Inicia una transacción de pago con Webpay
   * 
   * @param data Datos de la reserva y el paciente
   * @returns Observable con token y URL de redirección a Webpay
   */
  initTransaction(data: IniciarTransaccionWebpayRequest): Observable<IniciarTransaccionWebpayResponse> {
    console.log('[WEBPAY-SERVICE] Iniciando transacción:', {
      paqueteId: data.paqueteId,
      sesiones: data.sesiones.length,
      monto: data.monto,
      paciente: data.nombrePaciente
    });

    return this.http.post<IniciarTransaccionWebpayResponse>(
      `${this.apiUrl}/init`,
      data
    );
  }

  /**
   * Verifica y confirma una transacción de Webpay
   * 
   * @param token Token de Webpay retornado por Transbank
   * @returns Observable con resultado de la transacción y citas creadas
   */
  verifyTransaction(token: string): Observable<ConfirmarTransaccionWebpayResponse> {
    console.log('[WEBPAY-SERVICE] Verificando transacción:', token);

    return this.http.post<ConfirmarTransaccionWebpayResponse>(
      `${this.apiUrl}/verify`,
      { token }
    );
  }

  /**
   * Verifica el estado de una transacción sin confirmarla
   * 
   * @param token Token de Webpay
   * @returns Observable con estado de la transacción
   */
  getTransactionStatus(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/status/${token}`);
  }

  /**
   * Endpoint de prueba para verificar conectividad
   */
  testConnection(): Observable<{ message: string; sdkLoaded: boolean; configured: boolean }> {
    return this.http.get<{ message: string; sdkLoaded: boolean; configured: boolean }>(
      `${this.apiUrl}/test`
    );
  }
}
