import { Injectable, signal } from '@angular/core';
export interface Toast { id: number; message: string; type: 'success' | 'error' | 'warning' | 'info'; }
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private id = 0;
  show(message: string, type: Toast['type'] = 'info', duration = 4000) {
    const toast = { id: ++this.id, message, type };
    this._toasts.update(t => [...t, toast]);
    setTimeout(() => this._toasts.update(t => t.filter(x => x.id !== toast.id)), duration);
  }
}
