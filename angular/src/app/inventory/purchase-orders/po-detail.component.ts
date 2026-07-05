import { Component, inject, signal } from '@angular/core';
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
import { PurchaseOrder } from '../shared/inventory.models';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
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
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="inv-page">
      <a routerLink="/inventory/purchase-orders" class="back">← Back</a>
      @if (loading()) {
        <mat-spinner diameter="40" style="margin:40px auto" />
      } @else if (po()) {
        <mat-card class="po-header">
          <mat-card-header
            ><mat-card-title>{{
              po()!.orderNumber
            }}</mat-card-title></mat-card-header
          >
          <mat-card-content>
            <div class="info-grid">
              <div><strong>Supplier:</strong> {{ po()!.supplier.name }}</div>
              <div><strong>Warehouse:</strong> {{ po()!.warehouse.name }}</div>
              <div>
                <strong>Status:</strong>
                <mat-chip [color]="statusColor(po()!.status)" selected>{{
                  po()!.status
                }}</mat-chip>
              </div>
              <div>
                <strong>Order Date:</strong> {{ po()!.orderDate | date }}
              </div>
              <div>
                <strong>Expected:</strong> {{ po()!.expectedDate || '-' }}
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
                  Send to Supplier
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
                  Receive
                </button>
              }
              @if (
                po()!.status !== 'RECEIVED' && po()!.status !== 'CANCELLED'
              ) {
                <button mat-button color="warn" (click)="cancel()">
                  Cancel PO
                </button>
              }
            </div>
          </mat-card-content>
        </mat-card>
        <h3>Items</h3>
        <table mat-table [dataSource]="po()!.items" class="mat-elevation-z1">
          <ng-container matColumnDef="sku"
            ><th mat-header-cell *matHeaderCellDef>SKU</th>
            <td mat-cell *matCellDef="let i">
              {{ i.variantSku }}
            </td></ng-container
          >
          <ng-container matColumnDef="product"
            ><th mat-header-cell *matHeaderCellDef>Product</th>
            <td mat-cell *matCellDef="let i">
              {{ i.productName }} {{ i.variantSize }}/{{ i.variantColor }}
            </td></ng-container
          >
          <ng-container matColumnDef="ordered"
            ><th mat-header-cell *matHeaderCellDef>Ordered</th>
            <td mat-cell *matCellDef="let i">
              {{ i.quantityOrdered }}
            </td></ng-container
          >
          <ng-container matColumnDef="received"
            ><th mat-header-cell *matHeaderCellDef>Received</th>
            <td mat-cell *matCellDef="let i">
              {{ i.quantityReceived }}
            </td></ng-container
          >
          <ng-container matColumnDef="unitCost"
            ><th mat-header-cell *matHeaderCellDef>Unit Cost</th>
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
  styles: [
    `
      .inv-page {
        padding: 24px;
      }
      .back {
        color: #1976d2;
        text-decoration: none;
        display: inline-block;
        margin-bottom: 16px;
      }
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin: 16px 0;
      }
      .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
        margin-top: 16px;
      }
      table {
        width: 100%;
      }
    `,
  ],
})
export class PoDetailComponent {
  private api = inject(InventoryService);
  private route = inject(ActivatedRoute);
  private snack = inject(MatSnackBar);
  po = signal<PurchaseOrder | null>(null);
  loading = signal(true);
  receiveQty: Record<number, number> = {};
  itemCols = ['sku', 'product', 'ordered', 'received', 'unitCost', 'totalCost'];

  constructor() {
    this.api.getPurchaseOrder(+this.route.snapshot.params['id']).subscribe({
      next: (p) => {
        this.po.set(p);
        this.loading.set(false);
        p.items.forEach((i) => (this.receiveQty[i.id] = 0));
      },
      error: () => this.loading.set(false),
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

  updateStatus(s: string) {
    this.api.updatePOStatus(this.po()!.id, s).subscribe({
      next: (p) => {
        this.po.set(p);
        this.snack.open('Status updated', 'OK', { duration: 3000 });
      },
      error: (e) =>
        this.snack.open(e.error?.message || 'Error', 'OK', { duration: 5000 }),
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
        this.snack.open('Items received', 'OK', { duration: 3000 });
      },
      error: (e) =>
        this.snack.open(e.error?.message || 'Error', 'OK', { duration: 5000 }),
    });
  }

  cancel() {
    this.api.cancelPO(this.po()!.id).subscribe({
      next: () => {
        this.po()!.status = 'CANCELLED';
        this.snack.open('PO cancelled', 'OK', { duration: 3000 });
      },
      error: (e) =>
        this.snack.open(e.error?.message || 'Error', 'OK', { duration: 5000 }),
    });
  }
}
