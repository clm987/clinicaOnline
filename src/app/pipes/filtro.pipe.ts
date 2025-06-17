import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtro',
  standalone: true
})
export class FiltroPipe implements PipeTransform {

  transform(lista: string[], termino: string): string[] {
    if (!lista || !termino) {
      return lista || [];
    }

    const terminoNormalizado = termino.toLowerCase();

    return lista.filter(item =>
      item.toLowerCase().includes(terminoNormalizado)
    );
  }

}
