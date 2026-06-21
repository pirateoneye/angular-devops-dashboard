import { Component, Input } from '@angular/core';
import { ResponseData } from '../interfaces';

@Component({
  selector: 'msv-response-panel',
  templateUrl: './msv-response-panel.component.html',
  styleUrls: ['./msv-response-panel.component.css'],
})
export class MsvResponsePanelComponent {
  @Input() response: ResponseData | null = null;
  @Input() showData: boolean = true;

  get hasData(): boolean {
    return this.response?.data != null;
  }

  get formattedData(): string {
    return JSON.stringify(this.response?.data, null, 2);
  }
}
