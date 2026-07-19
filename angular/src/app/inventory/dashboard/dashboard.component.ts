import { ErrorStateComponent } from '../../shared/component/error-state/error-state.component';
import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from '../shared/inventory.service';
import { DashboardStats } from '../shared/inventory.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'inventory-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    ErrorStateComponent,
  ],
  template: `
    <div class="inv-page">
      <h2>Dashboard Inventori</h2>

      @if (loading()) {
        <mat-spinner diameter="40" style="margin: 40px auto;" />
      } @else if (stats()) {
        <div class="stats-row">
          <mat-card class="stat-card"
            ><mat-icon>checkroom</mat-icon
            ><strong>{{ stats()!.totalProducts }}</strong
            ><span>Produk</span></mat-card
          >
          <mat-card class="stat-card"
            ><mat-icon>style</mat-icon
            ><strong>{{ stats()!.totalVariants }}</strong
            ><span>Varian</span></mat-card
          >
          <mat-card class="stat-card"
            ><mat-icon>attach_money</mat-icon
            ><strong>{{ stats()!.totalStockValue | number: '1.0-0' }}</strong
            ><span>Nilai Stok</span></mat-card
          >
          <mat-card class="stat-card" [class.warn]="stats()!.lowStockCount > 0"
            ><mat-icon>warning</mat-icon
            ><strong>{{ stats()!.lowStockCount }}</strong
            ><span>Peringatan Stok Menipis</span></mat-card
          >
          <mat-card class="stat-card"
            ><mat-icon>receipt_long</mat-icon
            ><strong>{{ stats()!.pendingPurchaseOrders }}</strong
            ><span>PO Tertunda</span></mat-card
          >
        </div>

        <h3>Pergerakan Terbaru</h3>
        <table
          mat-table
          [dataSource]="stats()!.recentMovements || []"
          class="mat-elevation-z1"
        >
          <ng-container matColumnDef="time"
            ><th mat-header-cell *matHeaderCellDef>Waktu</th>
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
            ><th mat-header-cell *matHeaderCellDef>Produk</th>
            <td mat-cell *matCellDef="let m">
              {{ m.productName }} {{ m.variantSize }}/{{ m.variantColor }}
            </td></ng-container
          >
          <ng-container matColumnDef="type"
            ><th mat-header-cell *matHeaderCellDef>Tipe</th>
            <td mat-cell *matCellDef="let m">
              <mat-chip
                [color]="m.quantity > 0 ? 'primary' : 'warn'"
                selected
                >{{ m.type }}</mat-chip
              >
            </td></ng-container
          >
          <ng-container matColumnDef="qty"
            ><th mat-header-cell *matHeaderCellDef>Jml</th>
            <td mat-cell *matCellDef="let m">{{ m.quantity }}</td></ng-container
          >
          <ng-container matColumnDef="warehouse"
            ><th mat-header-cell *matHeaderCellDef>Gudang</th>
            <td mat-cell *matCellDef="let m">
              {{ m.warehouseName }}
            </td></ng-container
          >
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      } @else {
        <omp-error-state message="Gagal memuat data dashboard." />
      }
    </div>
  `,
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private api = inject(InventoryService);
  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  error = signal(false);
  columns = ['time', 'sku', 'product', 'type', 'qty', 'warehouse'];

  ngOnInit() {
    this.api.getStats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loading.set(false);
        this.error.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }
}
