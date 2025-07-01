import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { SupabaseDbService } from '../../services/supabase-db.service';

@Component({
  selector: 'app-turnos-dia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './turnos-dia.component.html'
})
export class TurnosDiaComponent implements AfterViewInit, OnDestroy {
  @ViewChild('diaChart') canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart!: Chart;

  constructor(private db: SupabaseDbService) { }
  getImage(): string {
    return this.canvasRef.nativeElement.toDataURL('image/png', 1.0);
  }

  async ngAfterViewInit(): Promise<void> {
    const rows = await this.db.obtenerTurnosPorDia(); // [{fecha:'2025-06-10', total:5}, …]
    const ultimos15 = rows.slice(0, 15);

    const labels = ultimos15.map(r =>
      new Date(r.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
    );
    const data = ultimos15.map(r => r.total);

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Turnos',
            data,
            backgroundColor: '#007bff'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
