import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  selector: '[appSrcObject]',
  standalone: true,
})
export class SrcObjectDirective implements OnChanges {
  @Input() appSrcObject!: MediaStream | null;

  constructor(private el: ElementRef<HTMLVideoElement>) {}

  ngOnChanges(): void {
    if (this.el.nativeElement.srcObject !== this.appSrcObject) {
      this.el.nativeElement.srcObject = this.appSrcObject;
    }
  }
}
