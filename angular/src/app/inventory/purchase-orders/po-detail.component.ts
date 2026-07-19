import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from '../shared/inventory.service';
import { ActivityService } from '../../shared/service/activity.service';
import { PurchaseOrder, PurchaseOrderStatus } from '../shared/inventory.models';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../shared/component/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/component/error-state/error-state.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'po-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    EmptyStateComponent,
    ErrorStateComponent,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="inv-page">
      <a routerLink="/inventory/purchase-orders" class="back">← Kembali</a>
      @if (loading()) {
        <mat-spinner diameter="40" style="margin:40px auto" />
      } @else if (error()) {
        <omp-error-state message="Gagal memuat detail pesanan." />
      } @else if (po()) {
        <mat-card class="po-header">
          <mat-card-header
            ><mat-card-title>{{
              po()!.orderNumber
            }}</mat-card-title></mat-card-header
          >
          <mat-card-content>
            <div class="info-grid">
              <div><strong>Pemasok:</strong> {{ po()!.supplier.name }}</div>
              <div><strong>Gudang:</strong> {{ po()!.warehouse.name }}</div>
              <div>
                <strong>Status:</strong>
                <mat-chip [color]="statusColor(po()!.status)" selected>{{
                  po()!.status
                }}</mat-chip>
              </div>
              <div>
                <strong>Tanggal Pesanan:</strong> {{ po()!.orderDate | date }}
              </div>
              <div>
                <strong>Estimasi:</strong> {{ po()!.expectedDate || '-' }}
              </div>
              <div>
                <strong>Total:</strong>
                {{ po()!.totalAmount | currency: 'IDR' : 'symbol' : '1.0-0' }}
              </div>
            </div>
            <div class="actions">
              @if (po()!.status === 'DRAFT') {
                <button
                  mat-raised-button
                  color="primary"
                  (click)="updateStatus('SENT')"
                >
                  Kirim ke Pemasok
                </button>
              }
              @if (
                po()!.status === 'SENT' || po()!.status === 'PARTIALLY_RECEIVED'
              ) {
                @for (item of po()!.items; track item.id) {
                  <mat-form-field
                    appearance="outline"
                    style="width:80px;margin-right:8px"
                  >
                    <mat-label>{{ item.variantSku }}</mat-label
                    ><input
                      matInput
                      type="number"
                      [(ngModel)]="receiveQty[item.id]"
                      [max]="item.quantityOrdered - item.quantityReceived"
                    />
                  </mat-form-field>
                }
                <button mat-raised-button color="accent" (click)="receive()">
                  Terima
                </button>
              }
              @if (
                po()!.status !== 'RECEIVED' && po()!.status !== 'CANCELLED'
              ) {
                <button mat-button color="warn" (click)="cancel()">
                  Batalkan PO
                </button>
              }
            </div>
          </mat-card-content>
        </mat-card>
        <h3>Item</h3>
        <table mat-table [dataSource]="po()!.items" class="mat-elevation-z1">
          <ng-container matColumnDef="sku"
            ><th mat-header-cell *matHeaderCellDef>SKU</th>
            <td mat-cell *matCellDef="let i">
              {{ i.variantSku }}
            </td></ng-container
          >
          <ng-container matColumnDef="product"
            ><th mat-header-cell *matHeaderCellDef>Produk</th>
            <td mat-cell *matCellDef="let i">
              {{ i.productName }} {{ i.variantSize }}/{{ i.variantColor }}
            </td></ng-container
          >
          <ng-container matColumnDef="ordered"
            ><th mat-header-cell *matHeaderCellDef>Dipesan</th>
            <td mat-cell *matCellDef="let i">
              {{ i.quantityOrdered }}
            </td></ng-container
          >
          <ng-container matColumnDef="received"
            ><th mat-header-cell *matHeaderCellDef>Diterima</th>
            <td mat-cell *matCellDef="let i">
              {{ i.quantityReceived }}
            </td></ng-container
          >
          <ng-container matColumnDef="unitCost"
            ><th mat-header-cell *matHeaderCellDef>Harga Modal</th>
            <td mat-cell *matCellDef="let i">
              {{ i.unitCost | currency: 'IDR' : 'symbol' : '1.0-0' }}
            </td></ng-container
          >
          <ng-container matColumnDef="totalCost"
            ><th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let i">
              {{ i.totalCost | currency: 'IDR' : 'symbol' : '1.0-0' }}
            </td></ng-container
          >
          <tr mat-header-row *matHeaderRowDef="itemCols"></tr>
          <tr mat-row *matRowDef="let row; columns: itemCols"></tr>
        </table>
      }
    </div>
  `,
  styleUrls: ['./po-detail.component.css'],
})
export class PoDetailComponent {
  private readonly api = inject(InventoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly snack = inject(MatSnackBar);
  private readonly feed = inject(ActivityService);
  po = signal<PurchaseOrder | null>(null);
  loading = signal(true);
  error = signal(false);
  receiveQty: Record<number, number> = {};
  itemCols = ['sku', 'product', 'ordered', 'received', 'unitCost', 'totalCost'];

  constructor() {
    this.api.getPurchaseOrder(+this.route.snapshot.params['id']).subscribe({
      next: (p) => {
        this.po.set(p);
        this.loading.set(false);
        this.error.set(false);
        p.items.forEach((i) => (this.receiveQty[i.id] = 0));
      },
      error: () => { this.loading.set(false); this.error.set(true); },
    });
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

  updateStatus(s: PurchaseOrderStatus) {
    this.api.updatePOStatus(this.po()!.id, s).subscribe({
      next: (p) => {
        this.po.set(p);
        this.snack.open('Status diperbarui', 'OK', { duration: 3000 });
        this.feed.log('inventory', `Status pesanan diperbarui: ${p.orderNumber} -> ${p.status}`, 'info');
      },
      error: (e) => {
        this.snack.open(e.error?.message || 'Galat', 'OK', { duration: 5000 });
        this.feed.log('inventory', `Gagal memperbarui status pesanan: ${e.error?.message || 'Galat'}`, 'err');
      },
    });
  }

  receive() {
    const items = Object.entries(this.receiveQty)
      .filter(([, q]) => q > 0)
      .map(([id, q]) => ({ itemId: +id, quantityReceived: q }));
    if (!items.length) return;
    this.api.receivePO(this.po()!.id, items).subscribe({
      next: (p) => {
        this.po.set(p);
        this.snack.open('Item diterima', 'OK', { duration: 3000 });
        this.feed.log('inventory', `Item diterima: ${p.orderNumber}`, 'ok');
      },
      error: (e) => {
        this.snack.open(e.error?.message || 'Galat', 'OK', { duration: 5000 });
        this.feed.log('inventory', `Gagal menerima item: ${e.error?.message || 'Galat'}`, 'err');
      },
    });
  }

  cancel() {
    this.api.cancelPO(this.po()!.id).subscribe({
      next: () => {
        this.po()!.status = 'CANCELLED';
        this.snack.open('Pesanan pembelian dibatalkan', 'OK', { duration: 3000 });
        this.feed.log('inventory', `Pesanan dibatalkan: ${this.po()!.orderNumber}`, 'warn');
      },
      error: (e) => {
        this.snack.open(e.error?.message || 'Galat', 'OK', { duration: 5000 });
        this.feed.log('inventory', `Gagal membatalkan pesanan: ${e.error?.message || 'Galat'}`, 'err');
      },
    });
  }
}
