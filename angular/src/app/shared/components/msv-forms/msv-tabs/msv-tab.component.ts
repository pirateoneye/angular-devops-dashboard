import { Component, Input, TemplateRef, ViewChild } from '@angular/core';

@Component({
  standalone: true,
  selector: 'msv-tab',
  imports: [],
  template: `
  <ng-template>
    <ng-content></ng-content>
  </ng-template>
`,
})
export class MsvTabComponent {
  @Input() label: string = '';
  @Input() disabled: boolean = false;
  
  @ViewChild(TemplateRef, { static: true }) content!: TemplateRef<any>;
}
