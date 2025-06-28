import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TurnosRoutingModule } from './turnos-routing.module';
import { MensajeComponent } from '../components/mensaje/mensaje.component';

import { MisTurnosPacienteComponent } from './components/mis-turnos-paciente/mis-turnos-paciente.component';
import { MisTurnosEspecialistaComponent } from './components/mis-turnos-especialista/mis-turnos-especialista.component';

@NgModule({
  declarations: [
    MisTurnosPacienteComponent,
    MisTurnosEspecialistaComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TurnosRoutingModule,
    MensajeComponent
  ],
  exports: [
    MisTurnosPacienteComponent,
    MisTurnosEspecialistaComponent
  ]
})
export class TurnosModule { }
