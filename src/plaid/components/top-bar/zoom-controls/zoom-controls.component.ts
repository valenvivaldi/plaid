import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from "@angular/core";

/**
 * Dumb component, presents two buttons, handles zoom change shortcuts and delegates change in pixelsPerMinute value.
 */
@Component({
    selector: "plaid-zoom-controls",
    templateUrl: "./zoom-controls.component.html",
    standalone: false
})
export class ZoomControlsComponent implements OnInit, OnDestroy {
  static readonly MIN_PIXELS_PER_MINUTE_EXPONENT = 0;
  static readonly MAX_PIXELS_PER_MINUTE_EXPONENT = 4;

  zoomInButtonActive = false;
  zoomOutButtonActive = false;
  _pixelsPerMinuteExponent: number;

  @Input()
  shortcutsDisabled = false;

  @Input()
  allowBothColorSchemes = true;

  @Output()
  pixelsPerMinuteChange = new EventEmitter<number>();

  @Output()
  pixelsPerMinuteExponentChange = new EventEmitter<number>();

  private readonly onWheel = (event: WheelEvent): void => {
    if (!this.shortcutsDisabled && event.ctrlKey) {
      this.pixelsPerMinuteExponent -= event.deltaY / 800;
      this.emitChange();
      event.preventDefault();
    }
  };

  private readonly onShortcutKeydown = (event: KeyboardEvent): void => {
    if (!this.shortcutsDisabled && event.ctrlKey && !event.repeat) {
      if (event.key === "-" || event.key === "_") {
        this.zoomOutButtonActive = true;
        this.zoomOut();
        setTimeout(() => this.zoomOutButtonActive = false, 50);
      } else if (event.key === "+" || event.key === "=") {
        this.zoomInButtonActive = true;
        this.zoomIn();
        setTimeout(() => this.zoomInButtonActive = false, 50);
      }
    }
  };

  ngOnInit(): void {
    this.emitChange();
    window.addEventListener("wheel", this.onWheel, {passive: false});
    window.addEventListener("keydown", this.onShortcutKeydown);
  }

  ngOnDestroy(): void {
    window.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("keydown", this.onShortcutKeydown);
  }

  get pixelsPerMinuteExponent(): number {
    return this._pixelsPerMinuteExponent;
  }

  @Input()
  set pixelsPerMinuteExponent(value: number) {
    if (value < ZoomControlsComponent.MIN_PIXELS_PER_MINUTE_EXPONENT) {
      value = ZoomControlsComponent.MIN_PIXELS_PER_MINUTE_EXPONENT;
    } else if (value > ZoomControlsComponent.MAX_PIXELS_PER_MINUTE_EXPONENT) {
      value = ZoomControlsComponent.MAX_PIXELS_PER_MINUTE_EXPONENT;
    }

    this._pixelsPerMinuteExponent = value;
  }

  zoomIn(): void {
    this.pixelsPerMinuteExponent += 0.25;
    this.emitChange();
  }

  zoomOut(): void {
    this.pixelsPerMinuteExponent -= 0.25;
    this.emitChange();
  }

  emitChange(): void {
    this.pixelsPerMinuteExponentChange.emit(this.pixelsPerMinuteExponent);
    // Emitted value has reduced binary and decimal precision not to break layout.
    this.pixelsPerMinuteChange.emit(Math.round(Math.pow(2, this.pixelsPerMinuteExponent) * 128) / 128);
  }

  get isAbleToZoomIn(): boolean {
    return this.pixelsPerMinuteExponent < ZoomControlsComponent.MAX_PIXELS_PER_MINUTE_EXPONENT;
  }

  get isAbleToZoomOut(): boolean {
    return this.pixelsPerMinuteExponent > ZoomControlsComponent.MIN_PIXELS_PER_MINUTE_EXPONENT;
  }
}
