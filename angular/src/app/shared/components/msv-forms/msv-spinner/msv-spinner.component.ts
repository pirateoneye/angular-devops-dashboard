import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'msv-spinner',
  imports: [CommonModule],
  templateUrl: './msv-spinner.component.html',
  styleUrls: ['./msv-spinner.component.css'],
})
export class MsvSpinnerComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() color: string = '';

  get spinnerSize(): number {
    switch (this.size) {
      case 'small':
        return 16;
      case 'medium':
        return 32;
      case 'large':
        return 48;
      default:
        return 32;
    }
  }

  get spinnerColor(): string {
    return this.color || 'var(--msv-primary-color)';
  }

  get spinnerStyles(): { [key: string]: string } {
    return {
      width: `${this.spinnerSize}px`,
      height: `${this.spinnerSize}px`,
      borderColor: `${this.spinnerColor} transparent transparent transparent`,
    };
  }
}
