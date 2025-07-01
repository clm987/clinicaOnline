import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { SupabaseDbService } from '../../services/supabase-db.service';

@Component({
  selector: 'app-turnos-finalizados-medico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos-finalizados-medico.component.html',
  styleUrls: ['./turnos-finalizados-medico.component.css']
})
export class TurnosFinalizadosMedicoComponent implements OnInit {
  desde: string = '';
  hasta: string = '';
  chart: Chart | null = null;

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private db: SupabaseDbService) { }
  getImage(): string {
    return this.chartCanvas.nativeElement.toDataURL('image/png', 1.0);
  }

  ngOnInit(): void {
    const hoy = new Date();
    const hace7 = new Date();
    hace7.setDate(hoy.getDate() - 7);

    this.desde = hace7.toISOString().split('T')[0];
    this.hasta = hoy.toISOString().split('T')[0];

    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    if (!this.desde || !this.hasta) return;

    const datos = await this.db.obtenerTurnosFinalizadosPorMedico(this.desde, this.hasta);
    const nombres = datos.map(d => d.nombre);
    const cantidades = datos.map(d => d.total);

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: nombres,
        datasets: [{
          label: 'Turnos finalizados',
          data: cantidades,
          backgroundColor: 'rgba(75, 192, 192, 0.7)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Turnos Finalizados por Médico'
          }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}
