import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseDbService } from '../../services/supabase-db.service';
import { MensajeComponent } from '../mensaje/mensaje.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-log-ingresos',
  standalone: true,
  imports: [CommonModule, MensajeComponent],
  templateUrl: './log-ingresos.component.html',
  styleUrls: ['./log-ingresos.component.css']
})
export class LogIngresosComponent implements OnInit {
  private db = inject(SupabaseDbService);

  logs = signal<{ email: string; fecha: string; hora: string }[]>([]);
  mensaje = signal<{ texto: string; tipo: 'success' | 'error' } | null>(null);

  async ngOnInit() {
    try {
      const data = await this.db.obtenerLogIngresos();
      const procesados = data.map((l: any) => {
        const d = new Date(l.fecha_login);
        return {
          email: l.email,
          fecha: d.toLocaleDateString('es-ES'),
          hora: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        };
      });
      this.logs.set(procesados);
    } catch {
      this.mensaje.set({ texto: 'Error al cargar el log.', tipo: 'error' });
    }
  }

  descargarExcel() {
    if (!this.logs().length) {
      this.mensaje.set({ texto: 'Sin datos para exportar.', tipo: 'error' });
      return;
    }
    const ws = XLSX.utils.json_to_sheet(this.logs());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'LogIngresos');
    XLSX.writeFile(wb, 'log_ingresos.xlsx');
  }
}
