import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({standalone: true, selector: 'msv-tag',
imports: [CommonModule],
templateUrl: './msv-tag.component.html',
styleUrls: ['./msv-tag.component.css'],})
export class MsvTagComponent {
  @Input() color: 'primary' | 'success' | 'warning' | 'error' | 'default' = 'default';
  @Input() removable: boolean = false;
  @Output() removed = new EventEmitter<void>();

  get tagClass(): string {
    return `tag-${this.color}`;
  }

  onRemove(): void {
    this.removed.emit();
  }
}
