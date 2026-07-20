import {
  Component,
  ContentChildren,
  QueryList,
  AfterContentInit,
  HostListener,
  ElementRef,
  inject,
} from '@angular/core';
import { MsvMenuItemComponent } from './msv-menu-item.component';

@Component({
  standalone: true,
  selector: 'msv-menu',
  imports: [MsvMenuItemComponent],
  template: `
  <div class="msv-menu" role="menu">
    <ng-content></ng-content>
  </div>
`,
  styles: [
    `
      :host {
        display: block;
      }

      .msv-menu {
        display: flex;
        flex-direction: column;
        min-width: 160px;
        background: #ffffff;
        border-radius: var(--msv-border-radius, 5px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        padding: 4px 0;
        font-family: var(--msv-font-family, 'Open Sans', sans-serif);
        outline: none;
      }

      .msv-menu:focus {
        box-shadow: 0 0 0 2px var(--msv-focus-color, #005caa);
      }
    `,
  ],
})
export class MsvMenuComponent implements AfterContentInit {
  @ContentChildren(MsvMenuItemComponent)
  menuItems!: QueryList<MsvMenuItemComponent>;

  private focusedIndex = -1;

  public readonly elementRef = inject(ElementRef);

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
