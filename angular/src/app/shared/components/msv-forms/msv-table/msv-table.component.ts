import { Component, Input, Output, EventEmitter, Inject, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { MSV_FORMS_CONFIG, MsvFormsConfig } from '../msv-forms.config';
import { MsvTableColumn, SortChangeEvent, SortDirection } from './msv-table.types';

@Component({
  selector: 'msv-table',
  template: `
<div class="table-container">
  <div class="table-wrapper">
    <table class="msv-table">
      <thead>
        <tr>
          @for (column of columns; track column.key) {
            <th
              [class.sortable]="sortable && column.sortable"
              [class.sorted]="isSorted(column)"
              (click)="onHeaderClick(column)"
            >
              <div class="header-content">
                <span class="header-text">{{ column.header }}</span>
                @if (sortable && column.sortable) {
                  <span class="sort-indicator">
                    {{ getSortIndicator(column) }}
                  </span>
                }
              </div>
            </th>
          }
        </tr>
      </thead>
      <tbody>
        @for (row of paginatedData; track $index) {
          <tr
            [class.even-row]="$index % 2 === 0"
            [class.odd-row]="$index % 2 !== 0"
            (click)="onRowClick(row)"
          >
            @for (column of columns; track column.key) {
              <td>
                @if (column.template) {
                  <ng-container *ngTemplateOutlet="column.template; context: { $implicit: row, value: getCellValue(row, column) }"></ng-container>
                } @else {
                  {{ getCellValue(row, column) }}
                }
              </td>
            }
          </tr>
        }
      </tbody>
    </table>

    @if (paginatedData.length === 0) {
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p class="empty-text">No data available</p>
      </div>
    }
  </div>

  @if (paginator && data.length > 0) {
    <msv-pagination
      [totalItems]="data.length"
      [pageSize]="pageSize"
      [currentPage]="currentPage"
      (pageChange)="onPageChange($event)"
    ></msv-pagination>
  }
</div>
  `,
  styles: [`
.table-container {
  font-family: var(--msv-font-family);
  position: relative;
}

.table-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid var(--msv-border-color);
  border-radius: var(--msv-border-radius);
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(20, 78, 131, 0.08);
  position: relative;
}

.msv-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  position: relative;
}

/* Header Styles */
.msv-table thead {
  background: linear-gradient(135deg, var(--msv-primary-color), var(--msv-focus-color));
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(20, 78, 131, 0.15);
}

.msv-table th {
  padding: 16px 20px;
  text-align: left;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border-bottom: 3px solid rgba(255, 255, 255, 0.2);
  position: relative;
  user-select: none;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.msv-table th.sortable {
  cursor: pointer;
}

.msv-table th.sortable:hover {
  background: rgba(255, 255, 255, 0.15);
}

.msv-table th.sortable:active {
  background: rgba(255, 255, 255, 0.25);
}

.msv-table th.sorted {
  background: rgba(255, 255, 255, 0.2);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}

.header-text {
  flex: 1;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.sort-indicator {
  font-size: 12px;
  font-weight: 900;
  color: #ffffff;
  opacity: 0.7;
  transition: all 0.3s ease;
  min-width: 12px;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.msv-table th.sorted .sort-indicator {
  opacity: 1;
  transform: scale(1.2);
}

/* Body Styles */
.msv-table tbody tr {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

/* Striped Rows */
.msv-table tbody tr.even-row {
  background: #ffffff;
}

.msv-table tbody tr.odd-row {
  background: #f8f9fa;
}

/* Hover Effect */
.msv-table tbody tr:hover {
  background: linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%);
  transform: translateX(4px);
  box-shadow: -4px 0 0 0 var(--msv-primary-color),
              0 2px 12px rgba(20, 78, 131, 0.15);
}

/* Active/Click Effect */
.msv-table tbody tr:active {
  background: linear-gradient(135deg, #d1e9f6 0%, #e0f0ff 100%);
  transform: translateX(2px);
}

.msv-table td {
  padding: 14px 20px;
  font-size: 14px;
  color: #2c3e50;
  border-bottom: 1px solid #e9ecef;
  transition: all 0.2s ease;
  vertical-align: middle;
}

.msv-table tbody tr:last-child td {
  border-bottom: none;
}

/* Empty State */
.empty-state {
  padding: 80px 40px;
  text-align: center;
  background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
  position: relative;
  overflow: hidden;
}

.empty-state::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--msv-border-color),
    transparent
  );
  animation: emptyShimmer 2s ease-in-out infinite;
}

@keyframes emptyShimmer {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.4;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-text {
  font-size: 16px;
  font-weight: 600;
  color: #6c757d;
  margin: 0;
  letter-spacing: 0.3px;
}

/* Pagination Spacing */
.table-container > msv-pagination {
  display: block;
  margin-top: 16px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .msv-table th,
  .msv-table td {
    padding: 12px 16px;
    font-size: 13px;
  }

  .msv-table th {
    font-size: 12px;
  }

  .header-content {
    gap: 6px;
  }

  .sort-indicator {
    font-size: 10px;
    min-width: 10px;
  }
}

@media (max-width: 480px) {
  .msv-table th,
  .msv-table td {
    padding: 10px 12px;
    font-size: 12px;
  }

  .msv-table th {
    font-size: 11px;
    letter-spacing: 0.3px;
  }

  .empty-state {
    padding: 60px 20px;
  }

  .empty-icon {
    font-size: 48px;
  }

  .empty-text {
    font-size: 14px;
  }

  .msv-table tbody tr:hover {
    transform: translateX(2px);
    box-shadow: -2px 0 0 0 var(--msv-primary-color),
                0 2px 8px rgba(20, 78, 131, 0.1);
  }
}

/* Accessibility */
.msv-table:focus-within {
  outline: 2px solid var(--msv-focus-color);
  outline-offset: 2px;
}

/* Loading State (for future enhancement) */
.msv-table.loading {
  opacity: 0.6;
  pointer-events: none;
}

/* Smooth Transitions */
.msv-table tbody tr,
.msv-table td,
.sort-indicator {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
  `],
})
export class MsvTableComponent implements OnChanges, OnInit {
  @Input() data: any[] = [];
  @Input() columns: MsvTableColumn[] = [];
  @Input() sortable: boolean = false;
  @Input() paginator: boolean = false;
  @Input() pageSize: number = 10;

  @Output() rowClick = new EventEmitter<any>();
  @Output() sortChange = new EventEmitter<SortChangeEvent>();

  currentPage: number = 1;
  sortColumn: string | null = null;
  sortDirection: SortDirection = null;
  displayedData: any[] = [];

  constructor(@Inject(MSV_FORMS_CONFIG) public config: MsvFormsConfig) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['pageSize']) {
      this.updateDisplayedData();
    }
  }

  ngOnInit(): void {
    this.updateDisplayedData();
  }

  get totalPages(): number {
    if (!this.paginator || this.data.length === 0 || this.pageSize === 0) {
      return 1;
    }
    return Math.ceil(this.data.length / this.pageSize);
  }

  get paginatedData(): any[] {
    if (!this.paginator) {
      return this.displayedData;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.displayedData.slice(startIndex, endIndex);
  }

  onHeaderClick(column: MsvTableColumn): void {
    if (!this.sortable || !column.sortable) {
      return;
    }

    // Toggle sort direction
    if (this.sortColumn === column.key) {
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else if (this.sortDirection === 'desc') {
        this.sortDirection = null;
        this.sortColumn = null;
      } else {
        this.sortDirection = 'asc';
      }
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }

    this.updateDisplayedData();

    if (this.sortColumn && this.sortDirection) {
      this.sortChange.emit({
        column: this.sortColumn,
        direction: this.sortDirection,
      });
    }
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.currentPage = event.page;
    this.pageSize = event.pageSize;
    this.updateDisplayedData();
  }

  getCellValue(row: any, column: MsvTableColumn): any {
    return row[column.key];
  }

  getSortIndicator(column: MsvTableColumn): string {
    if (!this.sortable || !column.sortable || this.sortColumn !== column.key) {
      return '';
    }

    if (this.sortDirection === 'asc') {
      return '▲';
    } else if (this.sortDirection === 'desc') {
      return '▼';
    }
    return '';
  }

  isSorted(column: MsvTableColumn): boolean {
    return this.sortColumn === column.key && this.sortDirection !== null;
  }

  private updateDisplayedData(): void {
    let result = [...this.data];

    // Apply sorting
    if (this.sortColumn && this.sortDirection) {
      result = this.sortData(result, this.sortColumn, this.sortDirection);
    }

    this.displayedData = result;
  }

  private sortData(data: any[], column: string, direction: 'asc' | 'desc'): any[] {
    return data.sort((a, b) => {
      const aValue = a[column];
      const bValue = b[column];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return direction === 'asc' ? 1 : -1;
      if (bValue == null) return direction === 'asc' ? -1 : 1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }
}
