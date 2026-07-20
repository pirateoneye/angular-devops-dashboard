import {
  Component,
  Input,
  HostBinding,
  HostListener,
  EventEmitter,
  Output,
} from '@angular/core';

@Component({
  standalone: true,
  selector: 'msv-list-item',
  imports: [],
  template: `<ng-content></ng-content>`,
  styles: [
    `
      :host {
        display: block;
        padding: 12px 16px;
        cursor: pointer;
        transition: all 0.2s ease;
        border-radius: var(--msv-border-radius, 5px);
        font-family: var(--msv-font-family, 'Open Sans', sans-serif);
        user-select: none;
      }

      :host(:hover:not(.disabled)) {
        background-color: rgba(20, 78, 131, 0.08);
      }

      :host(.selected) {
        background-color: rgba(20, 78, 131, 0.15);
        font-weight: 600;
      }

      :host(.disabled) {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class MsvListItemComponent {
  @Input() value: any;
  @Input() disabled: boolean = false;

  @Output() itemClick = new EventEmitter<MsvListItemComponent>();

  @HostBinding('class.selected')
  selected: boolean = false;

  @HostBinding('class.disabled')
  get isDisabled(): boolean {
    return this.disabled;
  }

  @HostListener('click', ['$event'])
  onClick(_event: Event): void {
    if (!this.disabled) {
      this.itemClick.emit(this);
    }
  }

  setSelected(selected: boolean): void {
    this.selected = selected;
  }
}
