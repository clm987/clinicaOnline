import {
  Directive,
  HostBinding,
  Input,
  ElementRef,
  Renderer2,
  AfterViewInit
} from '@angular/core';

@Directive({
  selector: '[botonesRedondos]',
  standalone: true
})
export class BotonesRedondosDirective implements AfterViewInit {
  @Input() brSize = 64;

  @HostBinding('style.width.px') get w() { return this.brSize; }
  @HostBinding('style.height.px') get h() { return this.brSize; }
  @HostBinding('style.borderRadius') radius = '50%';
  @HostBinding('style.overflow') overflow = 'hidden';
  @HostBinding('style.padding') padding = '0';
  @HostBinding('style.border') border = '0';
  @HostBinding('style.outline') outline = '0';
  @HostBinding('style.background') bg = 'transparent';
  @HostBinding('style.position') pos = 'relative';
  @HostBinding('style.display') disp = 'inline-block';
  @HostBinding('style.boxShadow') shadow = '0 2px 6px rgba(0,0,0,0.2)';
  @HostBinding('style.transition') transition = 'transform 0.2s ease';

  constructor(private el: ElementRef<HTMLElement>, private rd: Renderer2) { }

  ngAfterViewInit(): void {
    const imgs = this.el.nativeElement.querySelectorAll('img');
    imgs.forEach(img => {
      this.rd.setStyle(img, 'width', '100%');
      this.rd.setStyle(img, 'height', '100%');
      this.rd.setStyle(img, 'object-fit', 'cover');
      this.rd.setStyle(img, 'border-radius', '50%');
      this.rd.setStyle(img, 'display', 'block');
      this.rd.setStyle(img, 'pointer-events', 'none');
    });

    this.rd.listen(this.el.nativeElement, 'mouseenter', () => {
      this.rd.setStyle(this.el.nativeElement, 'transform', 'scale(1.05)');
    });
    this.rd.listen(this.el.nativeElement, 'mouseleave', () => {
      this.rd.setStyle(this.el.nativeElement, 'transform', 'scale(1)');
    });
  }
}
