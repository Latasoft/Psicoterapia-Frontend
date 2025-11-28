import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BloquesManualesService, BloqueoManual as BloqueoManualService } from '../bloques-manuales.service';
import { ToastService } from '../../../services/toast.service';
import { ModalDetalleCitaComponent } from './modal-detalle-cita/modal-detalle-cita.component';

interface HorarioDisponible {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  modalidad: string;
}

interface Cita {
  id: number;
  fecha: string;
  hora: string;
  duracion: number;
  nombre_paciente: string;
  estado: string;
}

interface BloqueoManual {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  tipo: string;
  descripcion: string;
}

interface CeldaHoraria {
  hora: string;
  estado: 'disponible' | 'ocupado' | 'bloqueado' | 'fuera-horario';
  datos?: Cita | BloqueoManual;
  esPrimerBloque?: boolean;  // Para citas multi-bloque
  esBloqueContinuacion?: boolean;  // Para ocultar bloques intermedios
  bloquesOcupados?: number;  // Número de bloques que ocupa esta cita
}

@Component({
  selector: 'app-vista-semanal-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalDetalleCitaComponent],
  templateUrl: './vista-semanal-calendario.component.html',
  styleUrls: ['./vista-semanal-calendario.component.css']
})
export class VistaSemanalCalendarioComponent implements OnInit {
  semanaActual: Date = new Date();
  diasSemana: { fecha: Date; nombre: string; numero: number }[] = [];
  horasDelDia: string[] = [];
  matrizHoraria: Map<string, CeldaHoraria> = new Map();
  
  horarios: HorarioDisponible[] = [];
  citas: Cita[] = [];
  bloques: BloqueoManual[] = [];
  
  cargando = true;
  guardando = false; // Bandera para evitar guardados múltiples
  eliminando = false; // Bandera para evitar eliminaciones múltiples
  mostrarModalExcepcion = false;
  excepcionForm = {
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    tipo: 'bloqueo',
    descripcion: ''
  };
  bloqueSeleccionado: BloqueoManual | null = null;
  
  // Modal de detalle de cita
  mostrarModalDetalleCita = false;
  citaIdSeleccionada: number | null = null;

  constructor(
    private http: HttpClient,
    private bloquesManualesService: BloquesManualesService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.generarHorasDelDia();
    this.calcularDiasDeLaSemana();
    this.cargarDatos();
  }

  generarHorasDelDia() {
    // Generar franjas de 30 minutos desde las 8:00 hasta las 20:00
    for (let hora = 8; hora < 20; hora++) {
      this.horasDelDia.push(`${hora.toString().padStart(2, '0')}:00`);
      this.horasDelDia.push(`${hora.toString().padStart(2, '0')}:30`);
    }
    this.horasDelDia.push('20:00');
  }

  calcularDiasDeLaSemana() {
    this.diasSemana = [];
    const primerDia = this.obtenerLunesDeLaSemana(this.semanaActual);
    
    const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    for (let i = 0; i < 7; i++) {
      // Crear una NUEVA instancia de fecha para cada día (inmutable)
      const fecha = new Date(primerDia.getTime());
      fecha.setDate(fecha.getDate() + i);
      
      this.diasSemana.push({
        fecha: fecha,
        nombre: nombresDias[i],
        numero: i + 1
      });
    }
    
    console.log('[DIAS-SEMANA] Calculados:', this.diasSemana.map(d => ({
      nombre: d.nombre,
      fecha: this.formatearFecha(d.fecha),
      numero: d.numero
    })));
  }

  obtenerLunesDeLaSemana(fecha: Date): Date {
    const dia = new Date(fecha);
    const diaSemana = dia.getDay();
    const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
    dia.setDate(dia.getDate() + diff);
    dia.setHours(0, 0, 0, 0);
    return dia;
  }

  /**
   * Recarga SOLO los bloques manuales sin tocar horarios ni citas
   * Esto es más rápido y evita parpadeos innecesarios
   */
  async recargarSoloBloques() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    const fechaInicio = this.formatearFecha(this.diasSemana[0].fecha);
    const fechaFin = this.formatearFecha(this.diasSemana[6].fecha);
    const timestamp = Date.now();
    const random = Math.random();

    try {
      console.log('[RECARGA-BLOQUES] Recargando solo bloques manuales...');
      
      const bloquesRes = await this.http.get<any>(`${environment.apiUrl}/api/bloques-manuales`, {
        headers,
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          t: timestamp.toString(),
          r: random.toString()
        }
      }).toPromise();

      this.bloques = bloquesRes || [];
      
      console.log('[RECARGA-BLOQUES] Bloques actualizados:', this.bloques.length);
      
      // Reconstruir solo la matriz horaria (es rápido, no requiere llamadas HTTP)
      this.construirMatrizHoraria();
      
      console.log('[RECARGA-BLOQUES] Matriz reconstruida exitosamente');
    } catch (error) {
      console.error('[RECARGA-BLOQUES] Error:', error);
      throw error;
    }
  }

  async cargarDatos() {
    this.cargando = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    const fechaInicio = this.formatearFecha(this.diasSemana[0].fecha);
    const fechaFin = this.formatearFecha(this.diasSemana[6].fecha);
    
    const timestamp = Date.now();
    const random = Math.random(); // Forzar bypass de caché
    console.log('[VISTA-SEMANAL] Cargando datos para semana:', { fechaInicio, fechaFin, timestamp, random });

    try {
      const [horariosRes, citasRes, bloquesRes] = await Promise.all([
        this.http.get<any>(`${environment.apiUrl}/api/admin/horarios?t=${timestamp}&r=${random}`, { headers }).toPromise(),
        this.http.get<any>(`${environment.apiUrl}/api/citas`, { 
          headers,
          params: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            t: timestamp.toString(),
            r: random.toString()
          }
        }).toPromise(),
        this.http.get<any>(`${environment.apiUrl}/api/bloques-manuales`, {
          headers,
          params: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            t: timestamp.toString(),
            r: random.toString()
          }
        }).toPromise()
      ]);

      console.log('[VISTA-SEMANAL] Respuesta cruda de bloques:', bloquesRes);

      this.procesarHorarios(horariosRes);
      this.citas = citasRes || [];
      this.bloques = bloquesRes || [];
      
      console.log('[VISTA-SEMANAL] Datos cargados:', {
        horarios: this.horarios.length,
        citas: this.citas.length,
        bloques: this.bloques.length,
        bloquesDetalle: this.bloques.map(b => ({ 
          id: b.id,
          fecha: b.fecha, 
          hora_inicio: b.hora_inicio, 
          hora_fin: b.hora_fin,
          tipo: b.tipo
        }))
      });
      
      console.log('[VISTA-SEMANAL] Iniciando construcción de matriz...');
      this.construirMatrizHoraria();
      console.log('[VISTA-SEMANAL] Matriz construida, total celdas:', this.matrizHoraria.size);
    } catch (error) {
      console.error('[ERROR] Error cargando datos:', error);
    } finally {
      this.cargando = false;
    }
  }

  procesarHorarios(response: any) {
    this.horarios = [];
    console.log('[DEBUG] Procesando horarios:', response);
    if (response && response.horarioSemanal) {
      const diasMap: { [key: string]: number } = {
        'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4,
        'viernes': 5, 'sabado': 6, 'domingo': 7
      };

      Object.entries(response.horarioSemanal).forEach(([dia, bloques]: [string, any]) => {
        if (Array.isArray(bloques)) {
          bloques.forEach(bloque => {
            console.log('[DEBUG] Bloque horario:', { dia, bloque });
            
            // Validar que el bloque tenga datos completos
            if (!bloque || typeof bloque !== 'object') {
              console.warn('[WARN] Bloque inválido:', bloque);
              return;
            }
            
            // Extraer hora_inicio y hora_fin (puede venir como 'hora_inicio' o 'inicio')
            const horaInicio = bloque.hora_inicio || bloque.inicio;
            const horaFin = bloque.hora_fin || bloque.fin;
            
            if (!horaInicio || !horaFin) {
              console.warn('[WARN] Bloque con datos incompletos:', { dia, bloque, horaInicio, horaFin });
              return;
            }
            
            this.horarios.push({
              dia_semana: diasMap[dia],
              hora_inicio: horaInicio,
              hora_fin: horaFin,
              modalidad: bloque.modalidad || 'ambas'
            });
          });
        }
      });
    }
    console.log('[DEBUG] Horarios procesados:', this.horarios);
  }

  construirMatrizHoraria() {
    console.log('[MATRIZ] Construyendo matriz horaria...');
    console.log('[MATRIZ] diasSemana:', this.diasSemana.map(d => ({
      nombre: d.nombre,
      fecha: this.formatearFecha(d.fecha),
      numero: d.numero
    })));
    console.log('[MATRIZ] Bloques a procesar:', this.bloques.length);
    
    this.matrizHoraria.clear();

    let bloqueadosCount = 0;
    const celdasBloqueadasDetalle: any[] = [];
    const citasProcesadas = new Set<string>(); // Para evitar procesar la misma cita múltiples veces
    
    this.diasSemana.forEach(dia => {
      const fechaDiaStr = this.formatearFecha(dia.fecha);
      
      this.horasDelDia.forEach(hora => {
        const clave = this.generarClave(dia.fecha, hora);
        const estado = this.determinarEstado(dia, hora);
        
        let datos: Cita | BloqueoManual | undefined;
        let esPrimerBloque = false;
        let esBloqueContinuacion = false;
        let bloquesOcupados = 0;
        
        if (estado === 'ocupado') {
          datos = this.citas.find(c => {
            const fechaCita = typeof c.fecha === 'string' ? c.fecha : this.formatearFecha(new Date(c.fecha));
            return fechaCita === fechaDiaStr && this.horaEstaEnRango(hora, c.hora, c.duracion);
          });

          if (datos) {
            const citaId = `${datos.id}-${fechaDiaStr}`;
            
            // Verificar si esta es la primera celda de la cita
            const horaCitaNormalizada = this.normalizarHora(datos.hora);
            const horaActualNormalizada = this.normalizarHora(hora);
            
            if (horaCitaNormalizada === horaActualNormalizada) {
              // Esta es la primera celda de la cita
              esPrimerBloque = true;
              bloquesOcupados = Math.ceil(datos.duracion / 30); // Bloques de 30 min
              citasProcesadas.add(citaId);
            } else if (citasProcesadas.has(citaId)) {
              // Esta es una celda de continuación
              esBloqueContinuacion = true;
            }
          }
        } else if (estado === 'bloqueado') {
          datos = this.bloques.find(b => {
            const fechaBloqueo = typeof b.fecha === 'string' ? b.fecha : this.formatearFecha(new Date(b.fecha));
            const fechaMatch = fechaBloqueo === fechaDiaStr;
            const horaMatch = this.horaEstaEnRango(hora, b.hora_inicio, this.calcularDuracionMinutos(b.hora_inicio, b.hora_fin));
            return fechaMatch && horaMatch;
          });
          
          if (datos) {
            bloqueadosCount++;
            celdasBloqueadasDetalle.push({
              dia: dia.nombre,
              fecha: fechaDiaStr,
              hora: hora,
              bloqueo_id: datos.id,
              bloqueo_fecha: datos.fecha,
              bloqueo_inicio: datos.hora_inicio,
              bloqueo_fin: datos.hora_fin
            });
          }
        }
        
        this.matrizHoraria.set(clave, { 
          hora, 
          estado, 
          datos,
          esPrimerBloque,
          esBloqueContinuacion,
          bloquesOcupados
        });
      });
    });
    
    console.log('[MATRIZ] Matriz construida:', {
      totalCeldas: this.matrizHoraria.size,
      celdasBloqueadas: bloqueadosCount,
      detalleBloqueadas: celdasBloqueadasDetalle
    });
  }

  determinarEstado(dia: { fecha: Date; numero: number }, hora: string): CeldaHoraria['estado'] {
    const fechaStr = this.formatearFecha(dia.fecha);
    
    // Verificar si hay una cita en esta hora
    const tieneCita = this.citas.some(c => {
      const fechaCita = typeof c.fecha === 'string' ? c.fecha : this.formatearFecha(new Date(c.fecha));
      return fechaCita === fechaStr && this.horaEstaEnRango(hora, c.hora, c.duracion);
    });
    if (tieneCita) return 'ocupado';
    
    // Verificar si hay un bloqueo manual (PRIORIDAD sobre disponibilidad)
    const tieneBloqueo = this.bloques.some(b => {
      // Comparar fechas como strings directamente para evitar problemas de timezone
      const fechaBloqueo = typeof b.fecha === 'string' ? b.fecha : this.formatearFecha(new Date(b.fecha));
      const fechaMatch = fechaBloqueo === fechaStr;
      if (!fechaMatch) return false;
      
      const duracion = this.calcularDuracionMinutos(b.hora_inicio, b.hora_fin);
      const horaMatch = this.horaEstaEnRango(hora, b.hora_inicio, duracion);
      
      if (horaMatch && hora === '09:00') {
        console.log('[DEBUG] Bloqueo encontrado para 09:00:', {
          fecha: fechaStr,
          fechaBloqueo: fechaBloqueo,
          bloqueo: { inicio: b.hora_inicio, fin: b.hora_fin, duracion }
        });
      }
      
      return horaMatch;
    });
    if (tieneBloqueo) return 'bloqueado';
    
    // Verificar si está dentro del horario disponible
    const horarioDelDia = this.horarios.filter(h => h.dia_semana === dia.numero);
    const estaDisponible = horarioDelDia.some(h => 
      this.horaEstaEnRango(hora, h.hora_inicio, this.calcularDuracionMinutos(h.hora_inicio, h.hora_fin))
    );
    
    return estaDisponible ? 'disponible' : 'fuera-horario';
  }

  horaEstaEnRango(hora: string, horaInicio: string, duracionMinutos: number): boolean {
    if (!hora || !horaInicio || duracionMinutos === undefined) {
      return false;
    }
    
    // Normalizar formato quitando segundos si existen
    const horaNormalizada = this.normalizarHora(hora);
    const horaInicioNormalizada = this.normalizarHora(horaInicio);
    
    const [h, m] = horaNormalizada.split(':').map(Number);
    const minutosHora = h * 60 + m;
    
    const [hi, mi] = horaInicioNormalizada.split(':').map(Number);
    const minutosInicio = hi * 60 + mi;
    const minutosFin = minutosInicio + duracionMinutos;
    
    return minutosHora >= minutosInicio && minutosHora < minutosFin;
  }

  calcularDuracionMinutos(horaInicio: string, horaFin: string): number {
    if (!horaInicio || !horaFin) {
      console.warn('calcularDuracionMinutos: valores inválidos', { horaInicio, horaFin });
      return 0;
    }
    
    // Normalizar formato quitando segundos si existen
    const horaInicioNormalizada = this.normalizarHora(horaInicio);
    const horaFinNormalizada = this.normalizarHora(horaFin);
    
    const [hi, mi] = horaInicioNormalizada.split(':').map(Number);
    const [hf, mf] = horaFinNormalizada.split(':').map(Number);
    return (hf * 60 + mf) - (hi * 60 + mi);
  }

  normalizarHora(hora: string): string {
    // Convierte "09:00:00" a "09:00" o deja "09:00" como está
    if (!hora) return '00:00';
    const partes = hora.split(':');
    return `${partes[0]}:${partes[1]}`;
  }

  generarClave(fecha: Date, hora: string): string {
    return `${this.formatearFecha(fecha)}_${hora}`;
  }

  formatearFecha(fecha: Date): string {
    // Usar directamente los métodos de la fecha sin crear una nueva instancia
    // Esto evita problemas de conversión de timezone
    const year = fecha.getFullYear();
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const day = fecha.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  obtenerCelda(dia: { fecha: Date }, hora: string): CeldaHoraria | undefined {
    const clave = this.generarClave(dia.fecha, hora);
    return this.matrizHoraria.get(clave);
  }

  navegarSemana(direccion: number) {
    this.semanaActual.setDate(this.semanaActual.getDate() + (direccion * 7));
    this.calcularDiasDeLaSemana();
    this.cargarDatos();
  }

  semanaActualTexto(): string {
    const inicio = this.diasSemana[0].fecha;
    const fin = this.diasSemana[6].fecha;
    return `${inicio.getDate()} ${this.obtenerNombreMes(inicio)} - ${fin.getDate()} ${this.obtenerNombreMes(fin)} ${fin.getFullYear()}`;
  }

  obtenerNombreMes(fecha: Date): string {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses[fecha.getMonth()];
  }

  onCeldaClick(celda: CeldaHoraria, dia: { fecha: Date; nombre?: string; numero?: number }, hora?: string) {
    const horaActual = hora || celda.hora;
    
    console.log('[CLICK] Celda clickeada:', {
      fecha: this.formatearFecha(dia.fecha),
      hora: horaActual,
      estado: celda.estado,
      tieneDatos: !!celda.datos,
      datos: celda.datos
    });
    
    if (celda.estado === 'disponible') {
      // Abrir modal para agregar excepción
      this.abrirModalExcepcion(dia.fecha, horaActual);
    } else if (celda.estado === 'ocupado' && celda.datos && this.esCita(celda.datos)) {
      // Abrir modal de detalle de cita
      console.log('[CLICK] Abriendo detalle de cita:', celda.datos);
      this.abrirDetalleCita(celda.datos);
    } else if (celda.estado === 'bloqueado' && celda.datos) {
      console.log('[CLICK] Abriendo editor de bloqueo:', celda.datos);
      // Editar o eliminar bloqueo existente
      this.editarBloqueo(celda.datos as BloqueoManual);
    } else if (celda.estado === 'bloqueado' && !celda.datos) {
      console.warn('[CLICK] Celda bloqueada sin datos asociados');
    }
  }

  onCeldaClickSeguro(dia: { fecha: Date; nombre?: string; numero?: number }, hora: string) {
    console.log('[CLICK-SEGURO] Parámetros recibidos:', {
      dia_toString: dia.fecha.toString(),
      dia_toISOString: dia.fecha.toISOString(),
      dia_getFullYear: dia.fecha.getFullYear(),
      dia_getMonth: dia.fecha.getMonth(),
      dia_getDate: dia.fecha.getDate(),
      hora: hora,
      nombre: dia.nombre,
      numero: dia.numero
    });
    
    const celda = this.obtenerCelda(dia, hora);
    if (celda) {
      this.onCeldaClick(celda, dia, hora);
    }
  }

  obtenerTooltip(dia: { fecha: Date; nombre: string }, hora: string): string {
    const celda = this.obtenerCelda(dia, hora);
    if (!celda) return '';

    const fechaStr = `${dia.nombre} ${dia.fecha.getDate()}/${dia.fecha.getMonth() + 1}`;
    
    switch (celda.estado) {
      case 'disponible':
        return `✅ ${fechaStr} - ${hora}: Horario disponible. Click para bloquear.`;
      case 'ocupado':
        if (celda.datos && this.esCita(celda.datos)) {
          return `📅 ${fechaStr} - ${hora}: Cita con ${celda.datos.nombre_paciente} (${celda.datos.duracion} min)`;
        }
        return `📅 ${fechaStr} - ${hora}: Cita reservada`;
      case 'bloqueado':
        if (celda.datos && this.esBloqueo(celda.datos)) {
          return `🚫 ${fechaStr} - ${hora}: ${celda.datos.tipo.toUpperCase()} - ${celda.datos.descripcion || 'Click para editar'}`;
        }
        return `🚫 ${fechaStr} - ${hora}: Bloqueado`;
      case 'fuera-horario':
        return `⚪ ${fechaStr} - ${hora}: Fuera del horario de atención`;
      default:
        return '';
    }
  }

  abrirModalExcepcion(fecha: Date, hora: string) {
    this.bloqueSeleccionado = null;
    
    console.log('[MODAL-ANTES] Fecha recibida:', {
      tipo: typeof fecha,
      toString: fecha.toString(),
      toISOString: fecha.toISOString(),
      getFullYear: fecha.getFullYear(),
      getMonth: fecha.getMonth(),
      getDate: fecha.getDate(),
      hora: hora
    });
    
    // Formatear la fecha directamente sin crear copias innecesarias
    const fechaFormateada = this.formatearFecha(fecha);
    
    console.log('[MODAL-FORMATO] Fecha formateada:', fechaFormateada);
    
    this.excepcionForm = {
      fecha: fechaFormateada,
      hora_inicio: hora,
      hora_fin: this.calcularHoraFin(hora, 60), // Default 1 hora
      tipo: 'bloqueo',
      descripcion: ''
    };
    
    console.log('[MODAL-FORM] excepcionForm asignado:', JSON.stringify(this.excepcionForm, null, 2));
    
    this.mostrarModalExcepcion = true;
    
    // Verificar después de un pequeño delay (después de que Angular renderice)
    setTimeout(() => {
      console.log('[MODAL-DESPUES-RENDER] excepcionForm actual:', JSON.stringify(this.excepcionForm, null, 2));
    }, 100);
  }

  editarBloqueo(bloqueo: BloqueoManual) {
    this.bloqueSeleccionado = bloqueo;
    this.excepcionForm = {
      fecha: bloqueo.fecha,
      hora_inicio: bloqueo.hora_inicio,
      hora_fin: bloqueo.hora_fin,
      tipo: bloqueo.tipo,
      descripcion: bloqueo.descripcion || ''
    };
    this.mostrarModalExcepcion = true;
  }

  calcularHoraFin(horaInicio: string, minutos: number): string {
    const [h, m] = horaInicio.split(':').map(Number);
    const totalMinutos = h * 60 + m + minutos;
    const nuevaHora = Math.floor(totalMinutos / 60);
    const nuevosMinutos = totalMinutos % 60;
    return `${nuevaHora.toString().padStart(2, '0')}:${nuevosMinutos.toString().padStart(2, '0')}`;
  }

  cerrarModalExcepcion() {
    this.mostrarModalExcepcion = false;
    this.bloqueSeleccionado = null;
  }

  async guardarExcepcion() {
    // Evitar guardados duplicados
    if (this.guardando) {
      console.log('[GUARDAR] Ya hay un guardado en proceso, ignorando');
      return;
    }

    console.log('[GUARDAR-INICIO] excepcionForm antes de enviar:', {
      fecha: this.excepcionForm.fecha,
      fecha_tipo: typeof this.excepcionForm.fecha,
      hora_inicio: this.excepcionForm.hora_inicio,
      hora_fin: this.excepcionForm.hora_fin,
      tipo: this.excepcionForm.tipo,
      descripcion: this.excepcionForm.descripcion,
      form_completo: JSON.stringify(this.excepcionForm, null, 2)
    });

    this.guardando = true;

    try {
      let bloqueResultado: any;
      
      if (this.bloqueSeleccionado) {
        // Actualizar bloqueo existente
        bloqueResultado = await this.bloquesManualesService.actualizarBloqueo(
          this.bloqueSeleccionado.id!,
          this.excepcionForm
        ).toPromise();
        console.log('[GUARDAR-ACTUALIZAR] Resultado:', bloqueResultado);
      } else {
        // Crear nuevo bloqueo
        bloqueResultado = await this.bloquesManualesService.crearBloqueo(
          this.excepcionForm
        ).toPromise();
        console.log('[GUARDAR-CREAR] Resultado del backend:', bloqueResultado);
      }

      const esActualizacion = !!this.bloqueSeleccionado;
      this.cerrarModalExcepcion();
      
      // Actualización optimista: agregar/actualizar el bloque localmente
      if (esActualizacion && bloqueResultado) {
        // Actualizar en el array local
        const index = this.bloques.findIndex(b => b.id === bloqueResultado.id);
        if (index !== -1) {
          this.bloques[index] = bloqueResultado;
        }
      } else if (bloqueResultado) {
        // Agregar nuevo bloque al array local
        this.bloques.push(bloqueResultado);
      }
      
      // Reconstruir matriz con los datos actualizados (instantáneo)
      this.construirMatrizHoraria();
      console.log('[VISTA-SEMANAL] UI actualizada optimistamente');
      
      // Mostrar toast de éxito inmediatamente
      if (esActualizacion) {
        this.toastService.success('✓ Bloqueo actualizado correctamente');
      } else {
        this.toastService.success('✓ Bloqueo creado correctamente');
      }
      
      // Recargar desde servidor en segundo plano para confirmar
      setTimeout(async () => {
        try {
          await this.recargarSoloBloques();
          console.log('[VISTA-SEMANAL] Confirmación del servidor completada');
        } catch (error) {
          console.warn('[VISTA-SEMANAL] Error al confirmar con servidor:', error);
          // Si falla la confirmación, intentar recargar todo
          await this.cargarDatos();
        }
      }, 300);
      
    } catch (error: any) {
      console.error('[VISTA-SEMANAL] Error al guardar excepción:', error);
      
      // Manejo específico de errores
      let mensajeError = 'Error al guardar la excepción';
      
      if (error?.status === 409) {
        // Error 409 = Conflicto (duplicado o solapamiento)
        if (error?.error?.code === 'DUPLICADO') {
          mensajeError = 'Ya existe un bloque con la misma fecha y horario. Por favor, elige otro horario.';
        } else if (error?.error?.code === 'SOLAPAMIENTO') {
          mensajeError = error?.error?.error || 'El horario seleccionado se solapa con un bloque existente.';
        } else {
          mensajeError = error?.error?.error || 'Ya existe un bloque en este horario.';
        }
      } else if (error?.status === 0) {
        mensajeError = 'Error de conexión. Verifica tu conexión a internet.';
      } else if (error?.error?.error) {
        mensajeError = error.error.error;
      }
      
      this.toastService.error(mensajeError);
      
      // Si hubo error, recargar para asegurar consistencia
      try {
        await this.recargarSoloBloques();
      } catch (reloadError) {
        console.error('[GUARDAR] Error al recargar después de fallo:', reloadError);
      }
    } finally {
      this.guardando = false;
    }
  }

  async eliminarBloqueo() {
    if (!this.bloqueSeleccionado) {
      console.error('[ELIMINAR] No hay bloqueo seleccionado');
      return;
    }

    // Evitar eliminaciones duplicadas
    if (this.eliminando) {
      console.log('[ELIMINAR] Ya hay una eliminación en proceso, ignorando');
      return;
    }

    console.log('[ELIMINAR] Bloqueo a eliminar:', {
      id: this.bloqueSeleccionado.id,
      fecha: this.bloqueSeleccionado.fecha,
      hora_inicio: this.bloqueSeleccionado.hora_inicio,
      hora_fin: this.bloqueSeleccionado.hora_fin,
      tipo: this.bloqueSeleccionado.tipo
    });

    this.eliminando = true;
    const bloqueIdAEliminar = this.bloqueSeleccionado.id;

    try {
      console.log('[ELIMINAR] Llamando al servicio con ID:', bloqueIdAEliminar);
      
      // 1. Eliminar del servidor
      const resultado = await this.bloquesManualesService.eliminarBloqueo(
        bloqueIdAEliminar!
      ).toPromise();
      
      console.log('[ELIMINAR] Eliminación exitosa, resultado:', resultado);

      // 2. Cerrar modal primero
      this.cerrarModalExcepcion();

      // 3. Actualización local optimista (instantánea)
      this.bloques = this.bloques.filter(b => b.id !== bloqueIdAEliminar);
      this.construirMatrizHoraria();
      console.log('[ELIMINAR] UI actualizada optimistamente');

      // 4. Mostrar toast de éxito
      this.toastService.success('✓ Bloqueo eliminado correctamente');
      
      // 5. Recargar desde servidor en segundo plano para confirmar
      setTimeout(async () => {
        try {
          await this.recargarSoloBloques();
          console.log('[ELIMINAR] Confirmación del servidor completada');
        } catch (error) {
          console.warn('[ELIMINAR] Error al confirmar con servidor:', error);
          // Si falla la confirmación, intentar recargar todo
          await this.cargarDatos();
        }
      }, 300);
      
    } catch (error: any) {
      console.error('[ELIMINAR] Error al eliminar bloqueo:', error);
      console.error('[ELIMINAR] Error detalle:', JSON.stringify(error, null, 2));
      
      let mensajeError = 'Error al eliminar el bloqueo';
      if (error?.message) {
        mensajeError += ': ' + error.message;
      }
      
      this.toastService.error(mensajeError);
      
      // Si hubo error, recargar para asegurar consistencia
      await this.recargarSoloBloques();
    } finally {
      this.eliminando = false;
    }
  }

  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return this.formatearFecha(fecha) === this.formatearFecha(hoy);
  }

  esCita(datos: Cita | BloqueoManual): datos is Cita {
    return 'nombre_paciente' in datos;
  }

  esBloqueo(datos: Cita | BloqueoManual): datos is BloqueoManual {
    return 'tipo' in datos;
  }

  // ==========================================
  // ACCESIBILIDAD - ARIA LABELS
  // ==========================================
  
  obtenerAriaLabel(celda: CeldaHoraria, dia: { fecha: Date, nombre: string }, hora: string): string {
    const fechaStr = `${dia.nombre} ${dia.fecha.getDate()}`;
    
    if (celda.esBloqueContinuacion) {
      return ''; // Los bloques de continuación no necesitan label
    }
    
    switch (celda.estado) {
      case 'disponible':
        return `Horario disponible: ${fechaStr} a las ${hora}. Click para agendar.`;
        
      case 'ocupado':
        if (celda.datos && this.esCita(celda.datos)) {
          const cita = celda.datos as Cita;
          return `Cita de ${cita.nombre_paciente}, ${fechaStr} a las ${hora}, duración ${cita.duracion} minutos. Click para ver detalles.`;
        }
        return `Horario ocupado: ${fechaStr} a las ${hora}`;
        
      case 'bloqueado':
        if (celda.datos && this.esBloqueo(celda.datos)) {
          const bloqueo = celda.datos as BloqueoManual;
          return `Horario bloqueado: ${fechaStr} a las ${hora}. Motivo: ${bloqueo.tipo}${bloqueo.descripcion ? ' - ' + bloqueo.descripcion : ''}`;
        }
        return `Horario bloqueado: ${fechaStr} a las ${hora}`;
        
      case 'fuera-horario':
        return `Fuera de horario de atención: ${fechaStr} a las ${hora}`;
        
      default:
        return `${fechaStr} a las ${hora}`;
    }
  }

  // ==========================================
  // MODAL DETALLE CITA
  // ==========================================
  
  abrirDetalleCita(cita: Cita) {
    console.log('[VISTA-SEMANAL] Abriendo detalle de cita:', cita);
    this.citaIdSeleccionada = cita.id;
    this.mostrarModalDetalleCita = true;
  }

  cerrarModalDetalleCita() {
    this.mostrarModalDetalleCita = false;
    this.citaIdSeleccionada = null;
  }

  onCitaActualizada() {
    console.log('[VISTA-SEMANAL] Cita actualizada, recargando datos...');
    this.cargarDatos();
  }
}
