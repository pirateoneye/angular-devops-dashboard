import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'msv-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="msv-card" [ngClass]="cardClasses">
      <div class="msv-card-header">
        <ng-content select="[msvCardHeader]"></ng-content>
      </div>
      <div class="msv-card-body">
        <ng-content></ng-content>
      </div>
      <div class="msv-card-footer">
        <ng-content select="[msvCardFooter]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .msv-card {
      background: #ffffff;
      border-radius: var(--msv-border-radius, 5px);
      border: 1px solid var(--msv-border-color, #ced4da);
      transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }

    /* Elevation shadows - progressive depth */
    .elevation-0 {
      box-shadow: none;
    }

    .elevation-1 {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08),
                  0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .elevation-2 {
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12),
                  0 2px 4px rgba(0, 0, 0, 0.08);
    }

    .elevation-3 {
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15),
                  0 3px 6px rgba(0, 0, 0, 0.10);
    }

    .elevation-4 {
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.22),
                  0 5px 10px rgba(0, 0, 0, 0.16);
    }

    /* Padding modifiers */
    .with-padding .msv-card-header {
      padding: 20px 24px;
    }

    .with-padding .msv-card-body {
      padding: 20px 24px;
    }

    .with-padding .msv-card-footer {
      padding: 16px 24px;
    }

    /* Header section */
    .msv-card-header {
      border-bottom: 1px solid var(--msv-border-color, #ced4da);
      background: linear-gradient(to bottom, #fafbfc, #ffffff);
    }

    /* Body section */
    .msv-card-body {
      flex: 1;
    }

    /* Footer section */
    .msv-card-footer {
      border-top: 1px solid var(--msv-border-color, #ced4da);
      background: #fafbfc;
    }

    /* Accessibility & interaction */
    .msv-card:focus-within {
      outline: 2px solid var(--msv-focus-color, #005caa);
      outline-offset: 2px;
    }
  `]
})
export class MsvCardComponent {
  @Input() elevation: 0 | 1 | 2 | 3 | 4 = 1;
  @Input() padding: boolean = true;

  get cardClasses(): string[] {
    const classes = [`elevation-${this.elevation}`];
    if (this.padding) {
      classes.push('with-padding');
    }
    return classes;
  }
}
