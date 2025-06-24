import { Directive, forwardRef, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

@Directive({
  selector: '[appCaptcha]',
  standalone: true,
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CaptchaDirective),
      multi: true
    }
  ]
})
export class CaptchaDirective implements Validator {
  @Input() resultadoEsperado = '';

  validate(control: AbstractControl): ValidationErrors | null {
    const valor = control.value?.toString().trim();
    return valor === this.resultadoEsperado ? null : { captchaInvalido: true };
  }
}
