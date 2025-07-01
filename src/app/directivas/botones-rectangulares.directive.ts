import {
  Directive,
  HostBinding,
  Input,
  Renderer2,
  ElementRef,
  AfterViewInit
} from '@angular/core';

@Directive({
  selector: '[botonesRectangulares]',
  standalone: true
})
export class BotonesRectangularesDirective implements AfterViewInit {
  @Input() brWidth = 100;
  @Input() brHeight = 40;

  @HostBinding('style.display') display = 'inline-block';
  @HostBinding('style.width.px') get w() { return this.brWidth; }
  @HostBinding('style.height.px') get h() { return this.brHeight; }
  @HostBinding('style.borderRadius') borderRadius = '8px';
  @HostBinding('style.border') border = 'none';
  @HostBinding('style.padding') padding = '0.5rem 1rem';
  @HostBinding('style.backgroundColor') bg = '#f0f0f0';
  @HostBinding('style.boxShadow') boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
  @HostBinding('style.transition') transition = 'transform 0.15s ease, box-shadow 0.15s ease';
  @HostBinding('style.cursor') cursor = 'pointer';
  @HostBinding('style.textAlign') textAlign = 'center';
  @HostBinding('style.fontWeight') fontWeight = '500';

  constructor(private el: ElementRef, private rd: Renderer2) { }

  ngAfterViewInit(): void {
    this.rd.listen(this.el.nativeElement, 'mouseenter', () => {
      this.rd.setStyle(this.el.nativeElement, 'transform', 'translateY(-2px)');
      this.rd.setStyle(this.el.nativeElement, 'boxShadow', '0 4px 8px rgba(0,0,0,0.2)');
    });

    this.rd.listen(this.el.nativeElement, 'mouseleave', () => {
      this.rd.setStyle(this.el.nativeElement, 'transform', 'translateY(0)');
      this.rd.setStyle(this.el.nativeElement, 'boxShadow', '0 2px 6px rgba(0, 0, 0, 0.15)');
    });
  }
}
