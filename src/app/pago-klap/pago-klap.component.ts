import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-pago-klap',
  imports: [CommonModule],
  templateUrl: './pago-klap.component.html',
  styleUrl: './pago-klap.component.css'
})
export class PagoKlapComponent {
  mostrarQR: boolean = false; 

}
