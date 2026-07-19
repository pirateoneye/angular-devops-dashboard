import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmptyStateComponent } from '../../shared/component/empty-state/empty-state.component';

interface StockRow {
  sku: string;
  productName: string;
  variant: string;
  warehouse: string;
  quantity: number;
}

// ponytail: data tiruan — InventoryService belum memiliki endpoint "semua stok".
// Ganti dengan panggilan API nyata ketika backend menyediakan GET /api/stock/summary.
const MOCK_STOCK: StockRow[] = [
  {
    sku: 'TSH-BLK-M',
    productName: 'Classic Tee',
    variant: 'M / Black',
    warehouse: 'Main WH',
    quantity: 42,
  },
  {
    sku: 'TSH-BLK-L',
    productName: 'Classic Tee',
    variant: 'L / Black',
    warehouse: 'Main WH',
    quantity: 17,
  },
  {
    sku: 'TSH-WHT-M',
    productName: 'Classic Tee',
    variant: 'M / White',
    warehouse: 'East WH',
    quantity: 8,
  },
  {
    sku: 'JKT-BRN-XL',
    productName: 'Field Jacket',
    variant: 'XL / Brown',
    warehouse: 'Main WH',
    quantity: 3,
  },
  {
    sku: 'CAP-NAV-OS',
    productName: 'Snapback Cap',
    variant: 'OS / Navy',
    warehouse: 'West WH',
    quantity: 0,
  },
];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'stock-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    EmptyStateComponent,
  ],
  template: `
    <div class="inv-page">
      <div class="page-header">
        <h2>Manajemen Stok</h2>
        <div>
          <button
            mat-raised-button
            style="margin-right:8px"
            (click)="openAdjustDialog()"
          >
            <mat-icon>tune</mat-icon> Sesuaikan</button
          ><button
            mat-raised-button
            color="primary"
            (click)="openTransferDialog()"
          >
            <mat-icon>swap_horiz</mat-icon> Pindah
          </button>
        </div>
      </div>

      <nav class="links">
        <a routerLink="/inventory/alerts"
          ><mat-icon>warning</mat-icon> Peringatan</a
        >
        <a routerLink="/inventory/stock/movements"
          ><mat-icon>history</mat-icon> Riwayat Pergerakan</a
        >
      </nav>

      @if (loading()) {
        <mat-spinner diameter="40" class="spinner" />
      } @else if (rows().length === 0) {
        <omp-empty-state message="Data stok tidak tersedia" icon="inventory_2" />
      } @else {
        <table mat-table [dataSource]="rows()" class="mat-elevation-z1">
          <ng-container matColumnDef="sku">
            <th mat-header-cell *matHeaderCellDef>SKU</th>
            <td mat-cell *matCellDef="let r">{{ r.sku }}</td>
          </ng-container>
          <ng-container matColumnDef="productName">
            <th mat-header-cell *matHeaderCellDef>Nama Produk</th>
            <td mat-cell *matCellDef="let r">{{ r.productName }}</td>
          </ng-container>
          <ng-container matColumnDef="variant">
            <th mat-header-cell *matHeaderCellDef>Varian</th>
            <td mat-cell *matCellDef="let r">{{ r.variant }}</td>
          </ng-container>
          <ng-container matColumnDef="warehouse">
            <th mat-header-cell *matHeaderCellDef>Gudang</th>
            <td mat-cell *matCellDef="let r">{{ r.warehouse }}</td>
          </ng-container>
          <ng-container matColumnDef="quantity">
            <th mat-header-cell *matHeaderCellDef>Jumlah</th>
            <td mat-cell *matCellDef="let r">{{ r.quantity }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      }
    </div>
  `,
  styleUrls: ['./stock-view.component.css'],
})
export class StockViewComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  rows = signal<StockRow[]>([]);
  loading = signal(true);
  columns = ['sku', 'productName', 'variant', 'warehouse', 'quantity'];

  ngOnInit() {
    // TODO: ganti dengan panggilan API nyata — misal InventoryService ketika endpoint ringkasan-stok tersedia
    this.rows.set(MOCK_STOCK);
    this.loading.set(false);
  }

  openAdjustDialog() {
    import('./stock-adjust-dialog.component').then(
      ({ StockAdjustDialogComponent }) => {
        this.dialog.open(StockAdjustDialogComponent, { width: '400px' });
      },
    );
  }
  openTransferDialog() {
    import('./stock-transfer-dialog.component').then(
      ({ StockTransferDialogComponent }) => {
        this.dialog.open(StockTransferDialogComponent, { width: '400px' });
      },
    );
  }
}
