import { Component, OnInit } from '@angular/core';
import { TallerService } from '../../services/taller.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-taller',
  standalone: true,
  imports:[CommonModule],
  templateUrl: './taller.component.html',
  styleUrls: ['./taller.component.css']
})
export class TallerComponent implements OnInit {
  ultimoTaller: any;

  constructor(private tallerService: TallerService) {}

  ngOnInit(): void {
    this.tallerService.getTalleres().subscribe(talleres => {
      if (talleres.length > 0) {
        this.ultimoTaller = talleres[0]; // el más reciente si está ordenado
      }
    });
  }
  formatearValor(valor: number): string {
  return valor.toLocaleString('es-CL'); // Usa el formato chileno (70.000)
}

}
