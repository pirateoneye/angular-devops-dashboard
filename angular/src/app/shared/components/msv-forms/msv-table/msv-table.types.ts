import { TemplateRef } from '@angular/core';

export interface MsvTableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  template?: TemplateRef<any>;
}

export interface SortChangeEvent {
  column: string;
  direction: 'asc' | 'desc';
}

export type SortDirection = 'asc' | 'desc' | null;
