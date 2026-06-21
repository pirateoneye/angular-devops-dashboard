import { Component } from '@angular/core';

/**
 * Demo: this component is declared in AppModule (not standalone).
 * Because ToolboxComponent is registered in AppModule's `imports`,
 * <app-toolbox> is available here with ZERO per-component setup.
 */
@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css'],
})
export class DemoComponent {}