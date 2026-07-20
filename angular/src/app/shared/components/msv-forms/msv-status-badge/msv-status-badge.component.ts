import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'msv-status-badge',
  imports: [],
  templateUrl: './msv-status-badge.component.html',
  styleUrls: ['./msv-status-badge.component.css'],
})
export class MsvStatusBadgeComponent {
  @Input() status: 'SUCCESS' | 'ERROR' | 'ON_PROCESS' | null = null;

  get badgeClass(): string {
    switch (this.status) {
      case 'SUCCESS':
        return 'badge-available';
      case 'ERROR':
        return 'badge-failed';
      case 'ON_PROCESS':
        return 'badge-unavailable';
      default:
        return '';
    }
  }

  get badgeText(): string {
    switch (this.status) {
      case 'SUCCESS':
        return 'Success';
      case 'ERROR':
        return 'Error';
      case 'ON_PROCESS':
        return 'Processing...';
      default:
        return '';
    }
  }
}
