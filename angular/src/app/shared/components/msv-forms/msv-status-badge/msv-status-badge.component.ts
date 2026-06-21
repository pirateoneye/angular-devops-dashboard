import { Component, Input } from '@angular/core';

@Component({
  selector: 'msv-status-badge',
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
