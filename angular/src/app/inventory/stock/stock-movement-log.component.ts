import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { InventoryService } from '../shared/inventory.service';
import { StockMovement } from '../shared/inventory.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'stock-movement-log',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  template: `
    <div class="inv-page">
      <a routerLink="/inventory/stock" class="back">← Back to Stock</a>
      <h2>Movement History</h2>
      @if (loading()) {
        <mat-spinner diameter="40" style="margin:40px auto" />
      } @else if (data().length === 0) {
        <p class="empty">No movements recorded yet.</p>
      } @else {
        <table mat-table [dataSource]="data()" class="mat-elevation-z1">
          <ng-container matColumnDef="time"
            ><th mat-header-cell *matHeaderCellDef>Time</th>
            <td mat-cell *matCellDef="let m">
              {{ m.createdAt | date: 'short' }}
            </td></ng-container
          >
          <ng-container matColumnDef="sku"
            ><th mat-header-cell *matHeaderCellDef>SKU</th>
            <td mat-cell *matCellDef="let m">
              {{ m.variantSku }}
            </td></ng-container
          >
          <ng-container matColumnDef="product"
            ><th mat-header-cell *matHeaderCellDef>Product</th>
            <td mat-cell *matCellDef="let m">
              {{ m.productName }} {{ m.variantSize }}/{{ m.variantColor }}
            </td></ng-container
          >
          <ng-container matColumnDef="type"
            ><th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let m">
              <mat-chip
                [color]="m.quantity > 0 ? 'primary' : 'warn'"
                selected
                >{{ m.type }}</mat-chip
              >
            </td></ng-container
          >
          <ng-container matColumnDef="qty"
            ><th mat-header-cell *matHeaderCellDef>Qty</th>
            <td mat-cell *matCellDef="let m">{{ m.quantity }}</td></ng-container
          >
          <ng-container matColumnDef="wh"
            ><th mat-header-cell *matHeaderCellDef>Warehouse</th>
            <td mat-cell *matCellDef="let m">
              {{ m.warehouseName }}
            </td></ng-container
          >
          <ng-container matColumnDef="ref"
            ><th mat-header-cell *matHeaderCellDef>Ref</th>
            <td mat-cell *matCellDef="let m">
              {{ m.referenceType }} #{{ m.referenceId }}
            </td></ng-container
          >
          <ng-container matColumnDef="notes"
            ><th mat-header-cell *matHeaderCellDef>Notes</th>
            <td mat-cell *matCellDef="let m">
              {{ m.notes || '-' }}
            </td></ng-container
          >
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
        <mat-paginator
          [length]="total()"
          [pageSize]="20"
          (page)="onPage($event)"
        />
      }
    </div>
  `,
  styleUrls: ['./stock-movement-log.component.css'],
})
export class StockMovementLogComponent implements OnInit {
  private api = inject(InventoryService);
  data = signal<StockMovement[]>([]);
  total = signal(0);
  loading = signal(true);
  columns = ['time', 'sku', 'product', 'type', 'qty', 'wh', 'ref', 'notes'];

  ngOnInit() {
    this.load();
  }
  load(page = 0) {
    this.loading.set(true);
    this.api.getMovements({ page, size: 20 }).subscribe({
      next: (r) => {
        this.data.set(r.content);
        this.total.set(r.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
  onPage(e: PageEvent) {
    this.load(e.pageIndex);
  }
}
