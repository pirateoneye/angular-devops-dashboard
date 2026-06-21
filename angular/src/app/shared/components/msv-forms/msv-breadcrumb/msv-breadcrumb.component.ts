import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'msv-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './msv-breadcrumb.component.html',
  styleUrls: ['./msv-breadcrumb.component.css'],
})
export class MsvBreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
  @Input() separator: string = '/';

  isLastItem(index: number): boolean {
    return index === this.items.length - 1;
  }
}
