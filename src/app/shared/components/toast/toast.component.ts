import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let t of svc.toasts()" class="toast" [class]="t.type">{{t.message}}</div>>
    </div>>
  `,
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent { svc = inject(NotificationService); }
