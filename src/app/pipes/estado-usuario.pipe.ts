import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estadoUsuario',
  standalone: true
})
export class EstadoUsuarioPipe implements PipeTransform {
  transform(valor: boolean | null | undefined): string {
    if (valor === true) return 'Habilitado';
    if (valor === false) return 'Inhabilitado';
    return 'Desconocido';
  }
}
