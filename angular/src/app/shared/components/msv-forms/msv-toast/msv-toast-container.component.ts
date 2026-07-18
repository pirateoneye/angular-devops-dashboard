import { Component, OnInit, OnDestroy } from '@angular/core';
import { MsvToastService, Toast, ToastPosition } from './msv-toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'msv-toast-container',
  template: `
    <div [class]="'toast-container toast-position-' + position">
      @for (toast of toasts; track toast.id) {
        <msv-toast
          [toast]="toast"
          (dismissed)="onDismiss($event)"
        ></msv-toast>
      }
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        z-index: 9999;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .toast-container > * {
        pointer-events: auto;
      }

      /* Position variants */
      .toast-position-top-right {
        top: 20px;
        right: 20px;
      }

      .toast-position-top-left {
        top: 20px;
        left: 20px;
      }

      .toast-position-bottom-right {
        bottom: 20px;
        right: 20px;
      }

      .toast-position-bottom-left {
        bottom: 20px;
        left: 20px;
      }

      /* Reverse order for bottom positions (newest on bottom) */
      .toast-position-bottom-right,
      .toast-position-bottom-left {
        flex-direction: column-reverse;
      }

      @media (max-width: 768px) {
        .toast-container {
          left: 20px !important;
          right: 20px !important;
        }
      }
    `,
  ],
})
export class MsvToastContainerComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  position: ToastPosition = 'top-right';
  private subscription?: Subscription;

  constructor(private toastService: MsvToastService) {}

  ngOnInit(): void {
    this.subscription = this.toastService.getToasts().subscribe({
      next: (toasts) => {
        this.toasts = toasts;
        this.position = this.toastService.position;
      },
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onDismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
