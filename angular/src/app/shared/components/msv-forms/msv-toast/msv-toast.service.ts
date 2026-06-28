import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration: number;
  timestamp: number;
}

export interface ToastConfig {
  duration?: number;
  position?: ToastPosition;
}

/**
 * Service for showing toast notifications.
 *
 * Note on a11y: the live region is handled in the view layer —
 * `MsvToastContainerComponent` renders the toasts and `MsvToastComponent`
 * sets role="alert" and aria-live (assertive for errors, polite otherwise)
 * on each toast element. This service only manages toast state; it does not
 * own a live region itself.
 */
@Injectable({
  providedIn: 'root'
})
export class MsvToastService {
  private toasts$ = new Subject<Toast[]>();
  private activeToasts: Toast[] = [];
  private nextId = 1;

  public position: ToastPosition = 'top-right';
  public defaultDuration = 5000;

  /**
   * Get observable of active toasts
   */
  getToasts(): Observable<Toast[]> {
    return this.toasts$.asObservable();
  }

  /**
   * Show success toast
   */
  success(message: string, title?: string, config?: ToastConfig): void {
    this.show('success', message, title, config);
  }

  /**
   * Show error toast
   */
  error(message: string, title?: string, config?: ToastConfig): void {
    this.show('error', message, title, config);
  }

  /**
   * Show warning toast
   */
  warning(message: string, title?: string, config?: ToastConfig): void {
    this.show('warning', message, title, config);
  }

  /**
   * Show info toast
   */
  info(message: string, title?: string, config?: ToastConfig): void {
    this.show('info', message, title, config);
  }

  /**
   * Show toast with specified type
   */
  private show(type: ToastType, message: string, title?: string, config?: ToastConfig): void {
    const duration = config?.duration ?? this.defaultDuration;
    const position = config?.position ?? this.position;
    
    // Update position if different
    if (position !== this.position) {
      this.position = position;
    }

    const toast: Toast = {
      id: `toast-${this.nextId++}`,
      type,
      message,
      title,
      duration,
      timestamp: Date.now()
    };

    this.activeToasts.push(toast);
    this.toasts$.next([...this.activeToasts]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast.id);
      }, duration);
    }
  }

  /**
   * Dismiss toast by ID
   */
  dismiss(id: string): void {
    const index = this.activeToasts.findIndex(t => t.id === id);
    if (index !== -1) {
      this.activeToasts.splice(index, 1);
      this.toasts$.next([...this.activeToasts]);
    }
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.activeToasts = [];
    this.toasts$.next([]);
  }

  /**
   * Configure global toast settings
   */
  configure(config: ToastConfig): void {
    if (config.duration !== undefined) {
      this.defaultDuration = config.duration;
    }
    if (config.position !== undefined) {
      this.position = config.position;
    }
  }
}
