import {Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild} from '@angular/core';

/**
 * Dumb component, presents button, handles refresh shortcuts, and delegates refresh action
 */
@Component({
    selector: 'plaid-refresh-button',
    templateUrl: './refresh-button.component.html',
    standalone: false
})
export class RefreshButtonComponent {
  @Input()
  disabled = false;
  @Input()
  shortcutsDisabled = false;
  @Output()
  refresh = new EventEmitter<void>();
  @ViewChild('button', {static: true})
  button: ElementRef;
  buttonActive = false;

  @HostListener("window:keydown", ['$event'])
  onShortcutKeydown(e: KeyboardEvent): void {
    if ((e.key === "F5" || e.key.toLowerCase() === "r" && e.ctrlKey) && !this.shortcutsDisabled && !e.repeat) {
      this.buttonActive = true;
      this.button.nativeElement.click();
      setTimeout(() => this.buttonActive = false, 50);
    }
  }

  doRefresh(): void {
    if (!this.disabled) {
      this.refresh.emit();
    }
  }
}
