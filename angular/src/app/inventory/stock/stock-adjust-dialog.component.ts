import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { InventoryService } from '../shared/inventory.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'stock-adjust-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Adjust Stock</h2>
    <form [formGroup]="f" (ngSubmit)="save()" mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Variant ID</mat-label
        ><input matInput type="number" formControlName="variantId"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Warehouse ID</mat-label
        ><input matInput type="number" formControlName="warehouseId"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Quantity (positive=add, negative=remove)</mat-label
        ><input matInput type="number" formControlName="quantity"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Reason</mat-label><input matInput formControlName="reason"
      /></mat-form-field>
      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="close()">Cancel</button
        ><button mat-raised-button color="primary" [disabled]="f.invalid">
          Adjust
        </button>
      </div>
    </form>
  `,
})
export class StockAdjustDialogComponent {
  private api = inject(InventoryService);
  private snack = inject(MatSnackBar);
  f = new FormBuilder().group({
    variantId: [null, Validators.required],
    warehouseId: [null, Validators.required],
    quantity: [0, Validators.required],
    reason: ['', Validators.required],
  });
  constructor(public ref: MatDialogRef<StockAdjustDialogComponent>) {}
  save() {
    const { variantId, warehouseId, quantity, reason } = this.f.value;
    this.api
      .adjustStock({
        variantId: variantId ?? 0,
        warehouseId: warehouseId ?? 0,
        quantity: quantity ?? 0,
        reason: reason ?? '',
      })
      .subscribe({
        next: () => {
          this.snack.open('Stock adjusted', 'OK', { duration: 3000 });
          this.ref.close();
        },
        error: (e) =>
          this.snack.open(e.error?.message || 'Error', 'OK', {
            duration: 5000,
          }),
      });
  }
  close() {
    this.ref.close();
  }
}
