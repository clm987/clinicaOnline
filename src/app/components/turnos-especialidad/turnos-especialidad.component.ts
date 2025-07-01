import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { SupabaseDbService } from '../../services/supabase-db.service';

@Component({
  selector: 'app-turnos-especialidad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './turnos-especialidad.component.html',
  styleUrls: ['./turnos-especialidad.component.css']
})
export class TurnosEspecialidadComponent implements AfterViewInit {
  @ViewChild('grafico', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  constructor(private db: SupabaseDbService) { }
  getImage(): string {
    return this.canvas.nativeElement.toDataURL('image/png', 1.0);
  }

  async ngAfterViewInit(): Promise<void> {
    const filas = await this.db.obtenerTurnosPorEspecialidad();
    console.log("filas", filas);

    const labels = filas.map(f => f.nombre);
    const datos = filas.map(f => f.total);

    new Chart(this.canvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Turnos',
            data: datos,
            backgroundColor: '#007bff'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}
