import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { SupabaseDbService } from '../../services/supabase-db.service';

type MedicoRow = { nombre_especialista: string; total: number };

@Component({
  selector: 'app-turnos-solicitados-medico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos-solicitados-medico.component.html'
})
export class TurnosSolicitadosMedicoComponent
  implements AfterViewInit, OnDestroy {
  desde = this.hoy(-30);
  hasta = this.hoy();

  @ViewChild('solicitadosChart') canvasRef!: ElementRef<HTMLCanvasElement>;
  private chart!: Chart;

  cargando = false;
  error: string | null = null;

  constructor(private db: SupabaseDbService) { }
  getImage(): string {
    return this.canvasRef.nativeElement.toDataURL('image/png', 1.0);
  }

  ngAfterViewInit(): void {
    this.renderChart();
  }
  private hoy(offset = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().substring(0, 10);
  }

  async renderChart(): Promise<void> {
    this.error = null;
    this.cargando = true;
    try {
      const rows: MedicoRow[] = await this.db.obtenerTurnosSolicitadosMedico(
        this.desde,
        this.hasta
      );

      const labels = rows.map(r => r.nombre_especialista);
      const data = rows.map(r => r.total);

      if (this.chart) this.chart.destroy();

      this.chart = new Chart(this.canvasRef.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Turnos solicitados',
              data,
              backgroundColor: '#17a2b8'
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
    } catch (e: any) {
      this.error = e.message || 'Error al cargar datos';
    } finally {
      this.cargando = false;
    }
  }

  actualizarRango() {
    if (this.desde && this.hasta && this.desde <= this.hasta) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
