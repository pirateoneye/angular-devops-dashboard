import {
  Component,
  Input,
  Output,
  EventEmitter,
  ContentChildren,
  QueryList,
  AfterContentInit,
} from '@angular/core';
import { MsvListItemComponent } from './msv-list-item.component';

@Component({
  standalone: true,
  selector: 'msv-list',
  imports: [MsvListItemComponent],
  template: `
  <div class="msv-list" [class.selectable]="selectable">
    <ng-content></ng-content>
  </div>
`,
  styles: [
    `
      :host {
        display: block;
      }

      .msv-list {
        display: flex;
        flex-direction: column;
        font-family: var(--msv-font-family, 'Open Sans', sans-serif);
      }

      .selectable .msv-list-item {
        cursor: pointer;
      }
    `,
  ],
})
export class MsvListComponent implements AfterContentInit {
  @Input() selectable: boolean = false;
  @Input() multiple: boolean = false;
  @Output() selectionChange = new EventEmitter<any[]>();

  @ContentChildren(MsvListItemComponent)
  items!: QueryList<MsvListItemComponent>;

  private selectedItems: Set<MsvListItemComponent> = new Set();

  ngAfterContentInit(): void {
    // Subscribe to item clicks
    this.items.forEach((item) => {
      item.itemClick.subscribe({
        next: () => {
          if (this.selectable) {
            this.handleItemSelection(item);
          }
        },
      });
    });
  }

  private handleItemSelection(item: MsvListItemComponent): void {
    if (this.multiple) {
      // Multiple selection mode
      if (this.selectedItems.has(item)) {
        this.selectedItems.delete(item);
        item.setSelected(false);
      } else {
        this.selectedItems.add(item);
        item.setSelected(true);
      }
    } else {
      // Single selection mode
      if (this.selectedItems.has(item)) {
        // Deselect if already selected
        this.selectedItems.delete(item);
        item.setSelected(false);
      } else {
        // Deselect all others and select this one
        this.selectedItems.forEach((selectedItem) => {
          selectedItem.setSelected(false);
        });
        this.selectedItems.clear();
        this.selectedItems.add(item);
        item.setSelected(true);
      }
    }

    this.emitSelectionChange();
  }

  private emitSelectionChange(): void {
    const values = Array.from(this.selectedItems).map((item) => item.value);
    this.selectionChange.emit(values);
  }

  clearSelection(): void {
    this.selectedItems.forEach((item) => {
      item.setSelected(false);
    });
    this.selectedItems.clear();
    this.emitSelectionChange();
  }

  getSelectedValues(): any[] {
    return Array.from(this.selectedItems).map((item) => item.value);
  }
}
