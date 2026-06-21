import { Component, Input, Output, EventEmitter, ElementRef, HostListener, HostBinding } from '@angular/core';

@Component({
  selector: 'msv-menu-item',
  template: `
<div class="msv-menu-item-content" [class.disabled]="disabled">
  <ng-content></ng-content>
</div>
  `,
  styles: [`
/* CSS Variables */
:host {
  --msv-primary-color: #144e83;
  --msv-error-color: #dc3545;
  --msv-success-color: #28a745;
  --msv-warning-color: #ffc107;
  --msv-border-color: #ced4da;
  --msv-focus-color: #005caa;
  --msv-font-family: 'Open Sans', sans-serif;
  --msv-border-radius: 5px;
  --msv-input-height: 45px;
  --msv-input-padding: 5px 10px;
}

:host {
  display: block;
  outline: none;
}

.msv-menu-item-content {
  padding: 12px 20px;
  cursor: pointer;
  color: #2d3748;
  font-family: var(--msv-font-family);
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  user-select: none;
  background: white;
}

.msv-menu-item-content::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--msv-primary-color);
  transform: scaleX(0);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

:host(:hover:not(.disabled)) .msv-menu-item-content,
:host(:focus:not(.disabled)) .msv-menu-item-content {
  background: linear-gradient(
    90deg,
    rgba(20, 78, 131, 0.08) 0%,
    rgba(20, 78, 131, 0.04) 100%
  );
  color: var(--msv-focus-color);
  padding-left: 24px;
}

:host(:hover:not(.disabled)) .msv-menu-item-content::before,
:host(:focus:not(.disabled)) .msv-menu-item-content::before {
  transform: scaleX(1);
}

:host(:active:not(.disabled)) .msv-menu-item-content {
  background: rgba(20, 78, 131, 0.12);
  transform: scale(0.98);
}

.msv-menu-item-content.disabled {
  cursor: not-allowed;
  color: #a0aec0;
  opacity: 0.5;
}
  `]
})
export class MsvMenuItemComponent {
  @Input() disabled: boolean = false;
  @Output() triggered = new EventEmitter<void>();
  @Output() focused = new EventEmitter<void>();

  @HostBinding('class.disabled')
  get isDisabled(): boolean {
    return this.disabled;
  }

  @HostBinding('attr.role') role = 'menuitem';
  @HostBinding('attr.tabindex') get tabIndex(): number {
    return this.disabled ? -1 : 0;
  }
  @HostBinding('attr.aria-disabled') get ariaDisabled(): string {
    return this.disabled ? 'true' : 'false';
  }

  constructor(private elementRef: ElementRef) {}

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.disabled) {
      event.stopPropagation();
      this.triggered.emit();
    }
  }

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  onActivate(event: KeyboardEvent): void {
    if (!this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      this.triggered.emit();
    }
  }

  @HostListener('focus')
  onFocus(): void {
    if (!this.disabled) {
      this.focused.emit();
    }
  }

  focus(): void {
    this.elementRef.nativeElement.focus();
  }
}
