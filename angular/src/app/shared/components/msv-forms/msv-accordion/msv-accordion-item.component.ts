import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'msv-accordion-item',
  template: `
    <div class="msv-accordion-item" [class.expanded]="expanded" [class.disabled]="disabled">
      <button
        class="msv-accordion-header"
        type="button"
        [disabled]="disabled"
        (click)="toggle()"
        [attr.aria-expanded]="expanded"
        [attr.aria-disabled]="disabled">
        <span class="msv-accordion-title">{{ title }}</span>
        <span class="msv-accordion-chevron" [class.rotated]="expanded">▶</span>
      </button>
      <div class="msv-accordion-content-wrapper" [class.expanded]="expanded">
        <div class="msv-accordion-content">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Container */
    .msv-accordion-item {
      background: #ffffff;
      border: 2px solid var(--msv-border-color, #ced4da);
      border-radius: var(--msv-border-radius, 5px);
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .msv-accordion-item:hover:not(.disabled) {
      border-color: var(--msv-primary-color, #144e83);
      box-shadow: 0 2px 8px rgba(20, 78, 131, 0.12);
    }

    .msv-accordion-item.expanded {
      border-color: var(--msv-primary-color, #144e83);
      box-shadow: 0 4px 12px rgba(20, 78, 131, 0.15);
    }

    .msv-accordion-item.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f8f9fa;
    }

    /* Header Button */
    .msv-accordion-header {
      width: 100%;
      padding: 20px 24px;
      background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      font-family: var(--msv-font-family, 'Open Sans', sans-serif);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    /* Shimmer effect on hover */
    .msv-accordion-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(20, 78, 131, 0.08),
        transparent
      );
      transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .msv-accordion-header:hover::before {
      left: 100%;
    }

    .msv-accordion-item.expanded .msv-accordion-header {
      background: linear-gradient(135deg, var(--msv-primary-color, #144e83) 0%, #005caa 100%);
      color: #ffffff;
    }

    .msv-accordion-header:disabled {
      cursor: not-allowed;
      background: #e9ecef;
    }

    .msv-accordion-header:focus {
      outline: none;
      box-shadow: inset 0 0 0 2px var(--msv-focus-color, #005caa);
    }

    /* Title */
    .msv-accordion-title {
      font-size: 16px;
      font-weight: 600;
      text-align: left;
      flex: 1;
      position: relative;
      z-index: 1;
    }

    /* Chevron Icon */
    .msv-accordion-chevron {
      font-size: 12px;
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: inline-block;
      color: var(--msv-primary-color, #144e83);
      position: relative;
      z-index: 1;
    }

    .msv-accordion-item.expanded .msv-accordion-chevron {
      color: #ffffff;
    }

    .msv-accordion-chevron.rotated {
      transform: rotate(90deg);
    }

    /* Content Wrapper */
    .msv-accordion-content-wrapper {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .msv-accordion-content-wrapper.expanded {
      max-height: 2000px; /* Large enough for most content */
    }

    /* Content */
    .msv-accordion-content {
      padding: 24px;
      background: #ffffff;
      border-top: 2px solid rgba(20, 78, 131, 0.1);
      color: #2d3748;
      line-height: 1.6;
      animation: contentFadeIn 0.3s ease-in-out;
    }

    @keyframes contentFadeIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Accessibility - Focus visible */
    .msv-accordion-header:focus-visible {
      box-shadow: inset 0 0 0 3px var(--msv-focus-color, #005caa);
    }
  `]
})
export class MsvAccordionItemComponent {
  @Input() title: string = '';
  @Input() expanded: boolean = false;
  @Input() disabled: boolean = false;
  @Output() expandedChange = new EventEmitter<boolean>();

  toggle(): void {
    if (this.disabled) return;
    this.expanded = !this.expanded;
    this.expandedChange.emit(this.expanded);
  }

  setExpanded(value: boolean): void {
    this.expanded = value;
  }
}
