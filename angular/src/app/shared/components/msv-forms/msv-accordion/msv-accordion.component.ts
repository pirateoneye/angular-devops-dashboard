import {
  Component,
  ContentChildren,
  QueryList,
  AfterContentInit,
  Input,
} from '@angular/core';
import { MsvAccordionItemComponent } from './msv-accordion-item.component';

@Component({
  selector: 'msv-accordion',
  template: `
    <div class="msv-accordion">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .msv-accordion {
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-family: var(--msv-font-family, 'Open Sans', sans-serif);
      }
    `,
  ],
})
export class MsvAccordionComponent implements AfterContentInit {
  @Input() multi: boolean = false;

  @ContentChildren(MsvAccordionItemComponent)
  items!: QueryList<MsvAccordionItemComponent>;

  ngAfterContentInit(): void {
    // Subscribe to expansion changes
    this.items.forEach((item) => {
      item.expandedChange.subscribe({
        next: (expanded: boolean) => {
          if (expanded && !this.multi) {
            // Single mode: close all other items
            this.items.forEach((otherItem) => {
              if (otherItem !== item && otherItem.expanded) {
                otherItem.setExpanded(false);
              }
            });
          }
        },
      });
    });
  }
}
