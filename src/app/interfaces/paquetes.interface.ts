// ============================================
// INTERFACES PARA EL SISTEMA DE PAQUETES
// ============================================

/**
 * Paquete o tratamiento ofrecido
 */
export interface Paquete {
  id: string;
  nombre: string;
  descripcion: string;
  duracion: number; // en minutos
  modalidad: 'presencial' | 'online' | 'ambas';
  precio_nacional: number;
  precio_internacional: number;
  sesiones: number;
  icono?: string;
  color?: string;
  destacado: boolean;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Slot de horario disponible
 */
export interface HorarioSlot {
  inicio: string; // "09:00"
  fin: string; // "10:00"
  disponible: boolean;
  modalidad?: 'presencial' | 'online';
}

/**
 * Disponibilidad de un día específico
 */
export interface DisponibilidadDia {
  fecha: string; // YYYY-MM-DD
  horarios: HorarioSlot[];
  paquete?: {
    duracion: number;
    modalidad: string;
  };
}

/**
 * Resumen de disponibilidad de un mes
 */
export interface DisponibilidadMes {
  year: number;
  month: number;
  dias: DiaDelMes[];
}

/**
 * Día del mes con indicador de disponibilidad
 */
export interface DiaDelMes {
  fecha: string; // YYYY-MM-DD
  diaSemana: number; // 0-6
  tieneDisponibilidad: boolean;
}

/**
 * Datos del paciente (formulario)
 */
export interface DatosPaciente {
  rut: string;
  nombre: string;
  email: string;
  telefono: string;
  notas?: string;
  direccion?: string;
  comuna?: string;
}

/**
 * Sesión individual seleccionada dentro de un paquete
 */
export interface SesionSeleccionada {
  numero: number; // 1, 2, 3, 4
  fecha: string; // YYYY-MM-DD
  horario: HorarioSlot;
}

/**
 * Datos completos para crear una reserva
 */
export interface ReservaRequest {
  paqueteId: string;
  sesiones: Array<{ // Nuevo: array de sesiones
    fecha: string; // YYYY-MM-DD
    horaInicio: string; // HH:mm
    horaFin: string; // HH:mm
  }>;
  rutPaciente: string;
  nombrePaciente: string;
  emailPaciente: string;
  telefonoPaciente: string;
  notas?: string;
  direccion?: string;
  comuna?: string;
  modalidad?: string;
  metodoPago?: string;
  monto?: number;
}

/**
 * Respuesta de reserva exitosa
 */
export interface ReservaResponse {
  success: boolean;
  message?: string;
  cita?: {
    id: string;
    paquete: string;
    fecha: string;
    horario: string;
    modalidad: string;
    duracion: number;
    precio: number;
  };
  error?: string;
}

/**
 * Estado del modal de reserva
 */
export interface EstadoModal {
  abierto: boolean;
  paso: 1 | 2 | 3;
  paqueteSeleccionado: Paquete | null;
  fechaSeleccionada: string | null;
  horarioSeleccionado: HorarioSlot | null;
  datosPaciente: Partial<DatosPaciente>;
  procesando: boolean;
}
