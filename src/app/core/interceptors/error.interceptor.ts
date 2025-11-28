import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor para manejo centralizado de errores HTTP
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      console.error('HTTP Error:', error);

      let errorMessage = 'Ha ocurrido un error';

      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Error del servidor
        if (error.status === 0) {
          errorMessage = 'No se puede conectar al servidor. Verifica tu conexión.';
        } else if (error.status === 401) {
          errorMessage = 'No estás autenticado. Por favor, inicia sesión.';
        } else if (error.status === 403) {
          errorMessage = 'No tienes permisos para realizar esta acción.';
        } else if (error.status === 404) {
          errorMessage = 'Recurso no encontrado.';
        } else if (error.status === 400) {
          errorMessage = error.error?.error || error.error?.details || 'Datos inválidos.';
        } else if (error.status >= 500) {
          errorMessage = 'Error del servidor. Inténtalo más tarde.';
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        }
      }

      // Retornar error con mensaje formateado
      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        originalError: error
      }));
    })
  );
};
