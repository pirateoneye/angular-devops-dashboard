import { Component, Input } from '@angular/core';
import { ResponseData } from '../interfaces';
import { MsvStatusBadgeComponent } from '../msv-status-badge/msv-status-badge.component';

@Component({
  standalone: true,
  selector: 'msv-response-panel',
  imports: [MsvStatusBadgeComponent],
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
