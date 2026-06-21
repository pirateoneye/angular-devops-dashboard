import { Component, Input, Output, EventEmitter, Inject } from '@angular/core';
import { MSV_FORMS_CONFIG, MsvFormsConfig } from '../msv-forms.config';

export interface PageChangeEvent {
  page: number;
  pageSize: number;
}

@Component({
  selector: 'msv-pagination',
  template: `
<div class="pagination-container">
  <div class="pagination-info">
    <span class="info-text">
      {{ startItem }}-{{ endItem }} of {{ totalItems }}
    </span>
  </div>

  <div class="pagination-controls">
    <button
      class="nav-button first"
      [disabled]="isFirstPage"
      (click)="goToFirstPage()"
      title="First page"
      type="button"
    >
      <span class="icon">«</span>
    </button>

    <button
      class="nav-button prev"
      [disabled]="isFirstPage"
      (click)="goToPreviousPage()"
      title="Previous page"
      type="button"
    >
      <span class="icon">‹</span>
    </button>

    <div class="page-indicator">
      <span class="page-text">Page {{ currentPage }} of {{ totalPages }}</span>
    </div>

    <button
      class="nav-button next"
      [disabled]="isLastPage"
      (click)="goToNextPage()"
      title="Next page"
      type="button"
    >
      <span class="icon">›</span>
    </button>

    <button
      class="nav-button last"
      [disabled]="isLastPage"
      (click)="goToLastPage()"
      title="Last page"
      type="button"
    >
      <span class="icon">»</span>
    </button>
  </div>

  <div class="page-size-selector">
    <label for="pageSize" class="size-label">Show:</label>
    <select
      id="pageSize"
      class="size-select"
      [value]="pageSize"
      (change)="onPageSizeChange($event)"
    >
      <option *ngFor="let option of pageSizeOptions" [value]="option">
        {{ option }}
      </option>
    </select>
  </div>
</div>
  `,
  styles: [`
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 1px solid var(--msv-border-color);
  border-radius: var(--msv-border-radius);
  font-family: var(--msv-font-family);
  box-shadow: 0 2px 8px rgba(20, 78, 131, 0.08);
  position: relative;
  overflow: hidden;
}

.pagination-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    var(--msv-primary-color) 0%,
    var(--msv-focus-color) 50%,
    var(--msv-primary-color) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 0%;
  }
}

.pagination-info {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  min-width: 120px;
}

.info-text {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, var(--msv-primary-color), var(--msv-focus-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.nav-button {
  width: 40px;
  height: 40px;
  border: 2px solid var(--msv-border-color);
  background: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--msv-font-family);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.nav-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: var(--msv-primary-color);
  opacity: 0.15;
  transform: translate(-50%, -50%);
  transition: width 0.4s, height 0.4s;
}

.nav-button:hover:not(:disabled)::before {
  width: 100px;
  height: 100px;
}

.nav-button:hover:not(:disabled) {
  border-color: var(--msv-primary-color);
  background: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(20, 78, 131, 0.2);
}

.nav-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(20, 78, 131, 0.15);
}

.nav-button:disabled {
  background: #f8f9fa;
  border-color: #e9ecef;
  cursor: not-allowed;
  opacity: 0.5;
}

.nav-button .icon {
  font-size: 20px;
  font-weight: 700;
  color: var(--msv-primary-color);
  line-height: 1;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.nav-button:hover:not(:disabled) .icon {
  color: var(--msv-focus-color);
  transform: scale(1.15);
}

.nav-button:disabled .icon {
  color: #adb5bd;
}

.nav-button.first .icon,
.nav-button.last .icon {
  font-size: 18px;
}

.page-indicator {
  margin: 0 12px;
  padding: 8px 20px;
  background: linear-gradient(135deg, var(--msv-primary-color), var(--msv-focus-color));
  border-radius: 20px;
  box-shadow: 0 3px 10px rgba(20, 78, 131, 0.25);
  position: relative;
  overflow: hidden;
}

.page-indicator::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: slide 2s ease-in-out infinite;
}

@keyframes slide {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.page-text {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.size-label {
  font-size: 13px;
  font-weight: 600;
  color: #495057;
  letter-spacing: 0.3px;
}

.size-select {
  padding: 8px 32px 8px 12px;
  border: 2px solid var(--msv-border-color);
  border-radius: 8px;
  background: #ffffff;
  font-family: var(--msv-font-family);
  font-size: 14px;
  font-weight: 600;
  color: var(--msv-primary-color);
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23144e83' d='M6 8L2 4h8z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  min-width: 80px;
}

.size-select:hover {
  border-color: var(--msv-primary-color);
  box-shadow: 0 2px 8px rgba(20, 78, 131, 0.15);
}

.size-select:focus {
  outline: none;
  border-color: var(--msv-focus-color);
  box-shadow: 0 0 0 3px rgba(0, 92, 170, 0.1);
}

.size-select option {
  padding: 8px;
  font-weight: 600;
}

/* Responsive Design */
@media (max-width: 768px) {
  .pagination-container {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .pagination-info,
  .pagination-controls,
  .page-size-selector {
    width: 100%;
    justify-content: center;
  }

  .pagination-info {
    min-width: auto;
  }

  .page-indicator {
    margin: 0 8px;
  }
}

@media (max-width: 480px) {
  .nav-button {
    width: 36px;
    height: 36px;
  }

  .nav-button .icon {
    font-size: 18px;
  }

  .nav-button.first .icon,
  .nav-button.last .icon {
    font-size: 16px;
  }

  .page-indicator {
    padding: 6px 16px;
  }

  .page-text {
    font-size: 12px;
  }

  .info-text {
    font-size: 13px;
  }
}
  `],
})
export class MsvPaginationComponent {
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 10;
  @Input() currentPage: number = 1;
  @Input() pageSizeOptions: number[] = [10, 25, 50];

  @Output() pageChange = new EventEmitter<PageChangeEvent>();

  constructor(@Inject(MSV_FORMS_CONFIG) public config: MsvFormsConfig) {}

  get totalPages(): number {
    if (this.totalItems === 0 || this.pageSize === 0) {
      return 1;
    }
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get isFirstPage(): boolean {
    return this.currentPage === 1;
  }

  get isLastPage(): boolean {
    return this.currentPage >= this.totalPages;
  }

  get startItem(): number {
    if (this.totalItems === 0) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    const end = this.currentPage * this.pageSize;
    return Math.min(end, this.totalItems);
  }

  goToFirstPage(): void {
    if (!this.isFirstPage) {
      this.changePage(1);
    }
  }

  goToPreviousPage(): void {
    if (!this.isFirstPage) {
      this.changePage(this.currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (!this.isLastPage) {
      this.changePage(this.currentPage + 1);
    }
  }

  goToLastPage(): void {
    if (!this.isLastPage) {
      this.changePage(this.totalPages);
    }
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newPageSize = parseInt(select.value, 10);
    
    // Calculate which page to show after changing page size
    // Keep the first item visible if possible
    const firstItemIndex = (this.currentPage - 1) * this.pageSize;
    const newPage = Math.floor(firstItemIndex / newPageSize) + 1;
    
    this.pageSize = newPageSize;
    this.changePage(newPage);
  }

  private changePage(page: number): void {
    // Ensure page is within valid range
    const validPage = Math.max(1, Math.min(page, this.totalPages));
    this.currentPage = validPage;
    this.pageChange.emit({
      page: this.currentPage,
      pageSize: this.pageSize
    });
  }
}
