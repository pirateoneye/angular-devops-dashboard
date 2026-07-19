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
  selector: 'stock-transfer-dialog',
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
    <h2 mat-dialog-title>Pindah Stok</h2>
    <form [formGroup]="f" (ngSubmit)="save()" mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>ID Varian</mat-label
        ><input matInput type="number" formControlName="variantId"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>ID Gudang Asal</mat-label
        ><input matInput type="number" formControlName="sourceWarehouseId"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>ID Gudang Tujuan</mat-label
        ><input matInput type="number" formControlName="destWarehouseId"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Jumlah</mat-label
        ><input matInput type="number" formControlName="quantity"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Catatan</mat-label><input matInput formControlName="notes"
      /></mat-form-field>
      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="close()">Batal</button
        ><button mat-raised-button color="primary" [disabled]="f.invalid">
          Pindah
        </button>
      </div>
    </form>
  `,
})
export class StockTransferDialogComponent {
  private readonly api = inject(InventoryService);
  private readonly snack = inject(MatSnackBar);
  f = new FormBuilder().group({
    variantId: [null, Validators.required],
    sourceWarehouseId: [null, Validators.required],
    destWarehouseId: [null, Validators.required],
    quantity: [1, Validators.required],
    notes: [''],
  });
  constructor(public ref: MatDialogRef<StockTransferDialogComponent>) {}
  save() {
    const { variantId, sourceWarehouseId, destWarehouseId, quantity, notes } =
      this.f.value;
    this.api
      .transferStock({
        variantId: variantId ?? 0,
        sourceWarehouseId: sourceWarehouseId ?? 0,
        destWarehouseId: destWarehouseId ?? 0,
        quantity: quantity ?? 0,
        notes: notes || undefined,
      })
      .subscribe({
        next: () => {
          this.snack.open('Stok dipindahkan', 'OK', { duration: 3000 });
          this.ref.close();
        },
        error: (e) =>
          this.snack.open(e.error?.message || 'Galat', 'OK', {
            duration: 5000,
          }),
      });
  }
  close() {
    this.ref.close();
  }
}
