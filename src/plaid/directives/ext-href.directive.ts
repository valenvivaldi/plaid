import {Directive, ElementRef, HostListener, Input} from '@angular/core';
import {ElectronService} from '../core/electron/electron.service';

@Directive({
  selector: '[plaidExtHref]'
})
export class ExtHrefDirective {
  private _plaidExtHref: string;

  @Input()
  set plaidExtHref(value: string) {
    this._plaidExtHref = value;
    this.el.nativeElement.style.cursor = value != null ? 'pointer' : undefined;
  }

  constructor(private el: ElementRef, private electron: ElectronService) {
  }

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    console.log('===== ExtHrefDirective: CLICK DETECTADO =====');
    console.log('ExtHrefDirective: href =', this._plaidExtHref);
    console.log('ExtHrefDirective: event.target =', event.target);
    console.log('ExtHrefDirective: event.currentTarget =', event.currentTarget);
    
    if (this._plaidExtHref) {
      event.preventDefault();
      event.stopPropagation();
      console.log('ExtHrefDirective: ✅ ABRIENDO URL EXTERNA:', this._plaidExtHref);
      
      try {
        this.electron.shell.openExternal(this._plaidExtHref);
        console.log('ExtHrefDirective: ✅ Comando openExternal ejecutado exitosamente');
      } catch (error) {
        console.error('ExtHrefDirective: ❌ Error al abrir URL:', error);
      }
    } else {
      console.log('ExtHrefDirective: ⚠️ No hay href definido');
    }
    console.log('===== ExtHrefDirective: FIN CLICK =====');
  }

}
