import { Injectable, signal, effect } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _dark = signal(true);
  readonly isDark = this._dark.asReadonly();
  constructor() { effect(() => document.body.classList.toggle('light', !this._dark())); }
  toggle() { this._dark.update(v => !v); }
}
