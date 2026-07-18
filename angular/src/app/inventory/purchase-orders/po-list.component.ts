import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from '../shared/inventory.service';
import { PurchaseOrder } from '../shared/inventory.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'inventory-po-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="inv-page">
      <div class="page-header">
        <h2>Purchase Orders</h2>
        <a
          mat-raised-button
          color="primary"
          routerLink="/inventory/purchase-orders/new"
          ><mat-icon>add</mat-icon> New PO</a
        >
      </div>
      @if (loading()) {
        <mat-spinner diameter="40" style="margin:40px auto" />
      } @else if (data().length === 0) {
        <p class="empty">No purchase orders yet.</p>
      } @else {
        <table mat-table [dataSource]="data()" class="mat-elevation-z1">
          <ng-container matColumnDef="number"
            ><th mat-header-cell *matHeaderCellDef>Order #</th>
            <td mat-cell *matCellDef="let po">
              <a [routerLink]="['/inventory/purchase-orders', po.id]">{{
                po.orderNumber
              }}</a>
            </td></ng-container
          >
          <ng-container matColumnDef="supplier"
            ><th mat-header-cell *matHeaderCellDef>Supplier</th>
            <td mat-cell *matCellDef="let po">
              {{ po.supplier.name }}
            </td></ng-container
          >
          <ng-container matColumnDef="status"
            ><th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let po">
              <mat-chip [color]="statusColor(po.status)" selected>{{
                po.status
              }}</mat-chip>
            </td></ng-container
          >
          <ng-container matColumnDef="orderDate"
            ><th mat-header-cell *matHeaderCellDef>Order Date</th>
            <td mat-cell *matCellDef="let po">
              {{ po.orderDate | date }}
            </td></ng-container
          >
          <ng-container matColumnDef="expected"
            ><th mat-header-cell *matHeaderCellDef>Expected</th>
            <td mat-cell *matCellDef="let po">
              {{ po.expectedDate | date: 'shortDate' || '-' }}
            </td></ng-container
          >
          <ng-container matColumnDef="total"
            ><th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let po">
              {{ po.totalAmount | currency: 'IDR' : 'symbol' : '1.0-0' }}
            </td></ng-container
          >
          <ng-container matColumnDef="items"
            ><th mat-header-cell *matHeaderCellDef>Items</th>
            <td mat-cell *matCellDef="let po">
              {{ po.items?.length || 0 }}
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
  styles: [
    `
      .inv-page {
        padding: 24px;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .empty {
        text-align: center;
        color: #888;
        padding: 40px;
      }
      a {
        color: #1976d2;
        text-decoration: none;
      }
      table {
        width: 100%;
      }
    `,
  ],
})
export class PoListComponent implements OnInit {
  private api = inject(InventoryService);
  data = signal<PurchaseOrder[]>([]);
  total = signal(0);
  loading = signal(true);
  columns = [
    'number',
    'supplier',
    'status',
    'orderDate',
    'expected',
    'total',
    'items',
  ];

  ngOnInit() {
    this.load();
  }
  load(page = 0) {
    this.loading.set(true);
    this.api.getPurchaseOrders({ page, size: 20 }).subscribe({
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
  statusColor(s: string) {
    return s === 'RECEIVED'
      ? 'primary'
      : s === 'SENT'
        ? 'accent'
        : s === 'PARTIALLY_RECEIVED'
          ? 'primary'
          : s === 'CANCELLED'
            ? 'warn'
            : undefined;
  }
}
