import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'msv-progress',
  imports: [CommonModule],
  templateUrl: './msv-progress.component.html',
  styleUrls: ['./msv-progress.component.css'],
})
export class MsvProgressComponent {
  @Input() value: number = 0;
  @Input() showLabel: boolean = false;
  @Input() color: 'primary' | 'success' | 'warning' | 'error' = 'primary';
  @Input() striped: boolean = false;
  @Input() animated: boolean = false;

  get clampedValue(): number {
    return Math.max(0, Math.min(100, this.value));
  }

  get progressColor(): string {
    switch (this.color) {
      case 'primary':
        return 'var(--msv-primary-color)';
      case 'success':
        return 'var(--msv-success-color)';
      case 'warning':
        return 'var(--msv-warning-color)';
      case 'error':
        return 'var(--msv-error-color)';
      default:
        return 'var(--msv-primary-color)';
    }
  }

  get progressStyles(): { [key: string]: string } {
    return {
      width: `${this.clampedValue}%`,
      backgroundColor: this.progressColor,
    };
  }

  get progressClasses(): { [key: string]: boolean } {
    return {
      'msv-progress-bar': true,
      'msv-progress-striped': this.striped,
      'msv-progress-animated': this.animated && this.striped,
    };
  }
}
