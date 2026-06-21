import { Component, Input, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'msv-tab',
  template: `
    <ng-template>
      <ng-content></ng-content>
    </ng-template>
  `,
  standalone: false
})
export class MsvTabComponent {
  @Input() label: string = '';
  @Input() disabled: boolean = false;
  
  @ViewChild(TemplateRef, { static: true }) content!: TemplateRef<any>;
}
