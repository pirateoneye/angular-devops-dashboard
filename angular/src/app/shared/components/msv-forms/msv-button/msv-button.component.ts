import { Component, Input, Output, EventEmitter, Inject, TemplateRef } from '@angular/core';
import { MSV_FORMS_CONFIG, MsvFormsConfig } from '../msv-forms.config';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'msv-button',
  imports: [CommonModule],
  templateUrl: './msv-button.component.html',
  styleUrls: ['./msv-button.component.css'],
})
export class MsvButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' = 'primary';
  @Input() loading: boolean = false;
  @Input() disabled: boolean = false;
  @Input() fullWidth: boolean = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() loadingTemplate: TemplateRef<any> | null = null;

  @Output() clicked = new EventEmitter<void>();

  constructor(@Inject(MSV_FORMS_CONFIG) public config: MsvFormsConfig) {}

  onClick(): void {
    if (!this.loading && !this.disabled) {
      this.clicked.emit();
    }
  }

  get isDisabled(): boolean {
    return this.loading || this.disabled;
  }

  get buttonClasses(): string[] {
    const classes = [`button-${this.variant}`];
    if (this.isDisabled) {
      classes.push(`button-${this.variant}-disabled`);
    }
    if (this.fullWidth) {
      classes.push('full-width');
    }
    return classes;
  }
}
