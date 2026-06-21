import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Toast, ToastType } from './msv-toast.service';

@Component({
  selector: 'msv-toast',
  templateUrl: './msv-toast.component.html',
  styleUrls: ['./msv-toast.component.css']
})
export class MsvToastComponent implements OnInit, OnDestroy {
  @Input() toast!: Toast;
  @Output() dismissed = new EventEmitter<string>();

  visible = false;

  ngOnInit(): void {
    // Trigger animation after component is rendered
    setTimeout(() => {
      this.visible = true;
    }, 10);
  }

  ngOnDestroy(): void {
    this.visible = false;
  }

  get toastClass(): string {
    return `toast-${this.toast.type}`;
  }

  get iconSymbol(): string {
    switch (this.toast.type) {
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
    this.visible = false;
    // Wait for animation to complete before emitting
    setTimeout(() => {
      this.dismissed.emit(this.toast.id);
    }, 300);
  }
}
