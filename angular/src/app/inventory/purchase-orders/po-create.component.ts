import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { InventoryService } from '../shared/inventory.service';
import { Supplier, Warehouse } from '../shared/inventory.models';

interface LineItem {
  variantId: number;
  sku: string;
  name: string;
  quantity: number;
  unitCost: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'po-create',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="inv-page">
      <a routerLink="/inventory/purchase-orders" class="back">← Back</a>
      <h2>New Purchase Order</h2>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" style="width:100%"
          ><mat-label>Supplier</mat-label
          ><mat-select formControlName="supplierId">
            @for (s of suppliers(); track s.id) {
              <mat-option [value]="s.id"
                >{{ s.name }} ({{ s.code }})</mat-option
              >
            }
          </mat-select></mat-form-field
        >
        <mat-form-field appearance="outline" style="width:100%"
          ><mat-label>Warehouse</mat-label
          ><mat-select formControlName="warehouseId">
            @for (w of warehouses(); track w.id) {
              <mat-option [value]="w.id">{{ w.name }}</mat-option>
            }
          </mat-select></mat-form-field
        >
        <div style="display:flex;gap:12px">
          <mat-form-field appearance="outline" style="flex:1"
            ><mat-label>Expected Date</mat-label
            ><input matInput type="date" formControlName="expectedDate"
          /></mat-form-field>
        </div>
        <mat-form-field appearance="outline" style="width:100%"
          ><mat-label>Notes</mat-label
          ><textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
      </form>

      <h3>Items ({{ items().length }})</h3>
      @if (unresolvedSkus().length) {
        <div
          style="background:#fff3e0;color:#e65100;padding:8px 12px;border-radius:4px;margin-bottom:12px;font-size:13px"
        >
          Unresolved SKUs: {{ unresolvedSkus().join(', ') }}. These cannot be
          submitted — remove them or fix the variant lookup.
        </div>
      }
      <div class="add-item" style="display:flex;gap:8px;margin-bottom:16px">
        <mat-form-field appearance="outline" style="flex:2"
          ><mat-label>Variant SKU</mat-label
          ><input matInput [(ngModel)]="variantSku" (keyup.enter)="addItem()"
        /></mat-form-field>
        <mat-form-field appearance="outline" style="flex:1"
          ><mat-label>Qty</mat-label
          ><input matInput type="number" [(ngModel)]="itemQty"
        /></mat-form-field>
        <mat-form-field appearance="outline" style="flex:1"
          ><mat-label>Unit Cost</mat-label
          ><input matInput type="number" [(ngModel)]="itemCost"
        /></mat-form-field>
        <button mat-raised-button color="primary" (click)="addItem()">
          Add
        </button>
      </div>

      @if (items().length) {
        <table mat-table [dataSource]="items()" class="mat-elevation-z1">
          <ng-container matColumnDef="sku"
            ><th mat-header-cell *matHeaderCellDef>SKU</th>
            <td mat-cell *matCellDef="let i">{{ i.sku }}</td></ng-container
          >
          <ng-container matColumnDef="name"
            ><th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let i">{{ i.name }}</td></ng-container
          >
          <ng-container matColumnDef="qty"
            ><th mat-header-cell *matHeaderCellDef>Qty</th>
            <td mat-cell *matCellDef="let i">{{ i.quantity }}</td></ng-container
          >
          <ng-container matColumnDef="cost"
            ><th mat-header-cell *matHeaderCellDef>Unit Cost</th>
            <td mat-cell *matCellDef="let i">
              {{ i.unitCost | currency: 'IDR' : 'symbol' : '1.0-0' }}
            </td></ng-container
          >
          <ng-container matColumnDef="total"
            ><th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let i">
              {{
                i.quantity * i.unitCost | currency: 'IDR' : 'symbol' : '1.0-0'
              }}
            </td></ng-container
          >
          <tr mat-header-row *matHeaderRowDef="itemCols"></tr>
          <tr mat-row *matRowDef="let row; columns: itemCols"></tr>
        </table>
        <button
          mat-raised-button
          color="accent"
          (click)="submit()"
          [disabled]="form.invalid || !items().length"
          style="margin-top:16px"
        >
          Create PO
        </button>
      }
    </div>
  `,
  styleUrls: ['./po-create.component.css'],
})
export class PoCreateComponent implements OnInit {
  private api = inject(InventoryService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  suppliers = signal<Supplier[]>([]);
  warehouses = signal<Warehouse[]>([]);
  items = signal<LineItem[]>([]);
  /** SKUs that failed variant resolution — shown as an inline error. */
  unresolvedSkus = signal<string[]>([]);
  variantSku = '';
  itemQty = 1;
  itemCost = 0;
  itemCols = ['sku', 'name', 'qty', 'cost', 'total'];

  form = new FormBuilder().group({
    supplierId: [null, Validators.required],
    warehouseId: [null, Validators.required],
    expectedDate: [''],
    notes: [''],
  });

  ngOnInit() {
    this.api.getSuppliers().subscribe((s) => this.suppliers.set(s));
    this.api.getWarehouses().subscribe((w) => this.warehouses.set(w));
  }

  addItem() {
    if (!this.variantSku || this.itemQty <= 0) return;
    // TODO: Resolve SKU to variantId via API lookup (e.g. InventoryService.getVariantBySku).
    // The backend currently has no SKU-search endpoint; until one is added, variantId stays 0
    // and submit() will reject unresolved items with a user-visible error.
    this.items.update((i) => [
      ...i,
      {
        variantId: 0,
        sku: this.variantSku,
        name: this.variantSku,
        quantity: this.itemQty,
        unitCost: this.itemCost,
      },
    ]);
    this.variantSku = '';
    this.itemQty = 1;
    this.itemCost = 0;
  }

  submit() {
    // Reject line items whose SKU was never resolved to a variantId
    const unresolved = this.items()
      .filter((i) => !i.variantId)
      .map((i) => i.sku);
    if (unresolved.length) {
      this.unresolvedSkus.set(unresolved);
      this.snack.open(
        `Cannot create PO: ${unresolved.length} item(s) have unresolved SKUs. ` +
          'Remove them or add a variant lookup to resolve SKUs.',
        'OK',
        { duration: 6000 },
      );
      return;
    }
    this.unresolvedSkus.set([]);

    const { supplierId, warehouseId, expectedDate, notes } = this.form.value;
    this.api
      .createPurchaseOrder({
        supplierId: supplierId ?? 0,
        warehouseId: warehouseId ?? 0,
        expectedDate: expectedDate || undefined,
        notes: notes || undefined,
        items: this.items().map((i) => ({
          variantId: i.variantId || 1,
          quantity: i.quantity,
          unitCost: i.unitCost,
        })),
      })
      .subscribe({
        next: (p) => {
          this.router.navigate(['/inventory/purchase-orders', p.id]);
          this.snack.open('PO created', 'OK', { duration: 3000 });
        },
        error: (e) =>
          this.snack.open(e.error?.message || 'Error', 'OK', {
            duration: 5000,
          }),
      });
  }
}
