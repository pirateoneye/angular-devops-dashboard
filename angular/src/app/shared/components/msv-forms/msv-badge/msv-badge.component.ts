import { Component, Input } from '@angular/core';

@Component({
  selector: 'msv-badge',
  templateUrl: './msv-badge.component.html',
  styleUrls: ['./msv-badge.component.css'],
  standalone: false
})
export class MsvBadgeComponent {
  @Input() value: number | string = 0;
  @Input() max: number = 99;
  @Input() color: 'primary' | 'success' | 'warning' | 'error' = 'error';
  @Input() dot: boolean = false;

  get displayValue(): string {
    if (this.dot) {
      return '';
    }

    const numValue = typeof this.value === 'number' ? this.value : parseInt(this.value, 10);
    
    if (isNaN(numValue)) {
      return String(this.value);
    }

    return numValue > this.max ? `${this.max}+` : String(numValue);
  }

  get badgeClass(): string {
    return `badge-${this.color}${this.dot ? ' badge-dot' : ''}`;
  }

  get shouldShowBadge(): boolean {
    if (this.dot) {
      return true;
    }
    
    const numValue = typeof this.value === 'number' ? this.value : parseInt(this.value, 10);
    return !isNaN(numValue) && numValue > 0;
  }
}
