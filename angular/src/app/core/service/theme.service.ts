import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';
const THEME_KEY = 'msv-theme';

/**
 * Owns light/dark theming. Applies a `data-theme` attribute on <html> so the
 * CSS-variable layer in styles.css can swap the whole palette. Choice is
 * persisted in localStorage and defaults to the OS preference on first visit.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _mode = signal<ThemeMode>(this.resolveInitial());
  readonly mode = this._mode.asReadonly();
  readonly isDark = signal<boolean>(this._mode() === 'dark');

  init(): void {
    this.apply(this._mode());
  }

  toggle(): void {
    this.set(this._mode() === 'dark' ? 'light' : 'dark');
  }

  set(mode: ThemeMode): void {
    this._mode.set(mode);
    this.isDark.set(mode === 'dark');
    this.apply(mode);
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      /* ignore */
    }
  }

  private apply(mode: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', mode);
  }

  private resolveInitial(): ThemeMode {
    try {
      const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark') return saved;
      const prefersDark =
        typeof matchMedia !== 'undefined' &&
        matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }
}