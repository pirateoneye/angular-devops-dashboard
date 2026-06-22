import { Component } from '@angular/core';
import { ToolboxComponent } from '../toolbox/toolbox.component';

/**
 * Demo: lazy-loaded standalone page that embeds the global toolbox.
 * Pulling ToolboxComponent in here (instead of AppModule) keeps all 27
 * utility tools OUT of the main bundle.
 */
@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [ToolboxComponent],
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css'],
})
export class DemoComponent {}
