import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface WebpayTransactionRequest {
  buyOrder: string;
  sessionId: string;
  amount: number;
  returnUrl: string;
}

export interface WebpayTransactionResponse {
  token: string;
  url: string;
}

export interface WebpayCommitResponse {
  vci: string;
  amount: number;
  status: string;
  buyOrder: string;
  sessionId: string;
  cardDetail: any;
  accountingDate: string;
  transactionDate: string;
  authorizationCode: string;
  paymentTypeCode: string;
  responseCode: number;
  installmentsAmount: number;
  installmentsNumber: number;
  balance: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebpayService {
  private apiUrl = `${environment.apiUrl}/api/webpay`;

  constructor(private http: HttpClient) {}

  // Crear transacción
  createTransaction(transactionData: WebpayTransactionRequest): Observable<WebpayTransactionResponse> {
    return this.http.post<WebpayTransactionResponse>(`${this.apiUrl}/create`, transactionData);
  }

  // Confirmar transacción
  commitTransaction(token: string): Observable<WebpayCommitResponse> {
    return this.http.post<WebpayCommitResponse>(`${this.apiUrl}/commit`, { token });
  }

  // Obtener estado de transacción
  getTransactionStatus(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/status/${token}`);
  }

  // Agregar método de prueba
  testConnection(): Observable<any> {
    return this.http.get(`${this.apiUrl}/test`);
  }
}