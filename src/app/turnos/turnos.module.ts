import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TurnosRoutingModule } from './turnos-routing.module';
import { MensajeComponent } from '../components/mensaje/mensaje.component';
import { BotonesRedondosDirective } from '../directivas/botones-redondos.directive';
import { BotonesRectangularesDirective } from '../directivas/botones-rectangulares.directive';

import { MisTurnosPacienteComponent } from './components/mis-turnos-paciente/mis-turnos-paciente.component';
import { MisTurnosEspecialistaComponent } from './components/mis-turnos-especialista/mis-turnos-especialista.component';
import { AdminTurnosComponent } from './components/admin-turnos/admin-turnos.component';
import { EncuestaComponent } from '../components/encuesta/encuesta.component';

@NgModule({
  declarations: [
    MisTurnosPacienteComponent,
    MisTurnosEspecialistaComponent,
    AdminTurnosComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TurnosRoutingModule,
    MensajeComponent,
    BotonesRedondosDirective,
    BotonesRectangularesDirective,
    EncuestaComponent
  ],
  exports: [
    MisTurnosPacienteComponent,
    MisTurnosEspecialistaComponent
  ]
})
export class TurnosModule { }
