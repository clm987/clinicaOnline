import { Component, Input, OnInit } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-mensaje',
  standalone: true,
  imports: [NgIf, NgClass],
  templateUrl: './mensaje.component.html',
  styleUrl: './mensaje.component.css'
})
export class MensajeComponent implements OnInit {
  @Input() tipo: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() mensaje: string = '';
  @Input() autoCerrar: boolean = true;
  @Input() duracion: number = 4000;

  visible = true;

  ngOnInit(): void {
    if (this.autoCerrar) {
      setTimeout(() => this.visible = false, this.duracion);
    }
  }

  cerrar(): void {
    this.visible = false;
  }
}
