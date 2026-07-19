import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from '../shared/inventory.service';
import { EmptyStateComponent } from '../../shared/component/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/component/error-state/error-state.component';
import { Alert } from '../shared/inventory.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'stock-alerts',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="inv-page">
      <a routerLink="/inventory/stock" class="back">← Kembali ke Stok</a>
      <h2>Peringatan Stok</h2>
      @if (loading()) {
        <mat-spinner diameter="40" style="margin:40px auto" />
      } @else if (error()) {
        <omp-error-state message="Gagal memuat peringatan." />
      } @else if (alerts().length === 0) {
        <omp-empty-state message="Tidak ada peringatan aktif." icon="notifications" />
      } @else {
        <table mat-table [dataSource]="alerts()" class="mat-elevation-z1">
          <ng-container matColumnDef="type"
            ><th mat-header-cell *matHeaderCellDef>Tipe</th>
            <td mat-cell *matCellDef="let a">
              <mat-chip
                [color]="a.type === 'OUT_OF_STOCK' ? 'warn' : 'accent'"
                selected
                >{{ a.type }}</mat-chip
              >
            </td></ng-container
          >
          <ng-container matColumnDef="sku"
            ><th mat-header-cell *matHeaderCellDef>SKU</th>
            <td mat-cell *matCellDef="let a">
              {{ a.variantSku }}
            </td></ng-container
          >
          <ng-container matColumnDef="product"
            ><th mat-header-cell *matHeaderCellDef>Produk</th>
            <td mat-cell *matCellDef="let a">
              {{ a.productName }} {{ a.size }}/{{ a.color }}
            </td></ng-container
          >
          <ng-container matColumnDef="stock"
            ><th mat-header-cell *matHeaderCellDef>Stok</th>
            <td mat-cell *matCellDef="let a">
              {{ a.currentStock }}
            </td></ng-container
          >
          <ng-container matColumnDef="threshold"
            ><th mat-header-cell *matHeaderCellDef>Ambang</th>
            <td mat-cell *matCellDef="let a">
              {{ a.threshold }}
            </td></ng-container
          >
          <ng-container matColumnDef="message"
            ><th mat-header-cell *matHeaderCellDef>Pesan</th>
            <td mat-cell *matCellDef="let a">{{ a.message }}</td></ng-container
          >
          <ng-container matColumnDef="time"
            ><th mat-header-cell *matHeaderCellDef>Waktu</th>
            <td mat-cell *matCellDef="let a">
              {{ a.createdAt | date: 'short' }}
            </td></ng-container
          >
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      }
    </div>
  `,
  styleUrls: ['./stock-alerts.component.css'],
})
export class StockAlertsComponent implements OnInit {
  private readonly api = inject(InventoryService);
  alerts = signal<Alert[]>([]);
  loading = signal(true);
  error = signal(false);
  columns = ['type', 'sku', 'product', 'stock', 'threshold', 'message', 'time'];

  ngOnInit() {
    this.api.getAlerts().subscribe({
      next: (a) => {
        this.alerts.set(a);
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
