import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  standalone: true,
  selector: 'msv-alert',
  imports: [],
  templateUrl: './msv-alert.component.html',
  styleUrls: ['./msv-alert.component.css'],
})
export class MsvAlertComponent {
  @Input() type: 'info' | 'success' | 'warning' | 'error' = 'info';
  @Input() title: string = '';
  @Input() dismissible: boolean = false;
  @Input() icon: boolean = true;
  @Output() dismissed = new EventEmitter<void>();

  get alertClass(): string {
    switch (this.type) {
      case 'info':
        return 'alert-info';
      case 'success':
        return 'alert-success';
      case 'warning':
        return 'alert-warning';
      case 'error':
        return 'alert-error';
      default:
        return 'alert-info';
    }
  }

  get iconSymbol(): string {
    if (!this.icon) return '';
    
    switch (this.type) {
      case 'info':
        return 'ℹ';
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  }

  onDismiss(): void {
    this.dismissed.emit();
  }
}
