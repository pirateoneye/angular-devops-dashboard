import {
  Component,
  ContentChildren,
  QueryList,
  AfterContentInit,
  HostListener,
  ElementRef,
} from '@angular/core';
import { MsvMenuItemComponent } from './msv-menu-item.component';

@Component({
  selector: 'msv-menu',
  template: `
    <div class="msv-menu-panel" role="menu">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
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
      }

      .msv-menu-panel {
        background: white;
        border-radius: var(--msv-border-radius);
        box-shadow:
          0 10px 25px -5px rgba(0, 0, 0, 0.15),
          0 8px 10px -6px rgba(0, 0, 0, 0.1),
          0 0 0 1px rgba(20, 78, 131, 0.08);
        padding: 8px 0;
        min-width: 200px;
        max-width: 320px;
        font-family: var(--msv-font-family);
        animation: menuSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }

      @keyframes menuSlideIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-8px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `,
  ],
})
export class MsvMenuComponent implements AfterContentInit {
  @ContentChildren(MsvMenuItemComponent)
  menuItems!: QueryList<MsvMenuItemComponent>;

  private focusedIndex = -1;

  constructor(public elementRef: ElementRef) {}

  ngAfterContentInit(): void {
    // Set up keyboard navigation after items are loaded
    this.setupKeyboardNavigation();
  }

  private setupKeyboardNavigation(): void {
    const items = this.menuItems.toArray();
    items.forEach((item, index) => {
      item.focused.subscribe({
        next: () => {
          this.focusedIndex = index;
        },
      });
    });
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const items = this.menuItems.toArray();
    const enabledItems = items.filter((item) => !item.disabled);

    if (enabledItems.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextItem(enabledItems);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousItem(enabledItems);
        break;
      case 'Home':
        event.preventDefault();
        this.focusFirstItem(enabledItems);
        break;
      case 'End':
        event.preventDefault();
        this.focusLastItem(enabledItems);
        break;
    }
  }

  private focusNextItem(enabledItems: MsvMenuItemComponent[]): void {
    const currentIndex = this.getCurrentEnabledIndex(enabledItems);
    const nextIndex = (currentIndex + 1) % enabledItems.length;
    enabledItems[nextIndex].focus();
  }

  private focusPreviousItem(enabledItems: MsvMenuItemComponent[]): void {
    const currentIndex = this.getCurrentEnabledIndex(enabledItems);
    const previousIndex =
      currentIndex <= 0 ? enabledItems.length - 1 : currentIndex - 1;
    enabledItems[previousIndex].focus();
  }

  private focusFirstItem(enabledItems: MsvMenuItemComponent[]): void {
    enabledItems[0].focus();
  }

  private focusLastItem(enabledItems: MsvMenuItemComponent[]): void {
    enabledItems[enabledItems.length - 1].focus();
  }

  private getCurrentEnabledIndex(enabledItems: MsvMenuItemComponent[]): number {
    const allItems = this.menuItems.toArray();
    const focusedItem = allItems[this.focusedIndex];
    return enabledItems.indexOf(focusedItem);
  }

  focusFirstEnabledItem(): void {
    const enabledItems = this.menuItems
      .toArray()
      .filter((item) => !item.disabled);
    if (enabledItems.length > 0) {
      enabledItems[0].focus();
    }
  }
}
