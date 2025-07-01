import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseDbService } from '../../services/supabase-db.service';

@Component({
  selector: 'app-encuesta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './encuesta.component.html',
  styleUrls: ['./encuesta.component.css']
})
export class EncuestaComponent {
  private fb = inject(FormBuilder);
  private db = inject(SupabaseDbService);
  @Input() turnoId!: string;
  @Output() cerrar = new EventEmitter<'enviada' | 'cancelada'>();

  cargando = false;
  mensaje = '';

  form = this.fb.group({
    r1: ['', Validators.required],
    r2: ['', Validators.required],
    r3: ['', Validators.required]
  });

  opciones12 = ['Muy buena', 'Buena', 'Mala', 'Muy mala'];
  opciones3 = ['Sí', 'Puede ser', 'No'];

  async enviar(): Promise<void> {
    if (this.form.invalid) return;
    this.cargando = true;
    this.mensaje = '';
    try {
      await this.db.crearEncuesta({
        turno_id: this.turnoId,
        respuesta1: this.form.value.r1!,
        respuesta2: this.form.value.r2!,
        respuesta3: this.form.value.r3!
      });
      this.mensaje = 'Encuesta enviada ✔';
      this.cerrar.emit('enviada');
      (window as any).bootstrap.Modal.getInstance(
        document.getElementById('modalEncuesta')!
      ).hide();
    } catch {
      this.mensaje = 'Error al guardar la encuesta intente luego.';
    } finally {
      this.cargando = false;
    }
  }

  cancelar(): void {
    this.cerrar.emit('cancelada');
  }
}
