import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

const SIZES = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '3XL',
  '28',
  '30',
  '32',
  '34',
  '36',
  '38',
  '40',
];

@Component({
  selector: 'variant-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Add Variant</h2>
    <form [formGroup]="form" (ngSubmit)="save()" mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Size</mat-label
        ><mat-select formControlName="size">
          @for (s of sizes; track s) {
            <mat-option [value]="s">{{ s }}</mat-option>
          }
        </mat-select></mat-form-field
      >
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Color</mat-label><input matInput formControlName="color"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Color Hex</mat-label
        ><input matInput formControlName="colorHex" placeholder="#FF0000"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>SKU (auto if empty)</mat-label
        ><input matInput formControlName="sku"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Barcode</mat-label
        ><input matInput formControlName="barcode"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Cost Price</mat-label
        ><input matInput type="number" formControlName="costPrice"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Selling Price</mat-label
        ><input matInput type="number" formControlName="sellingPrice"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Initial Stock</mat-label
        ><input matInput type="number" formControlName="stockQuantity"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Low Stock Threshold</mat-label
        ><input matInput type="number" formControlName="lowStockThreshold"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Reorder Point</mat-label
        ><input matInput type="number" formControlName="reorderPoint"
      /></mat-form-field>
      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="close()">Cancel</button>
        <button mat-raised-button color="primary" [disabled]="form.invalid">
          Add
        </button>
      </div>
    </form>
  `,
})
export class VariantDialogComponent {
  sizes = SIZES;
  form!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<VariantDialogComponent>,
  ) {
    this.form = this.fb.group({
      size: ['', Validators.required],
      color: ['', Validators.required],
      colorHex: ['#'],
      sku: [''],
      barcode: [''],
      costPrice: [0, Validators.required],
      sellingPrice: [0, Validators.required],
      stockQuantity: [0],
      lowStockThreshold: [10],
      reorderPoint: [5],
      weightGrams: [null],
    });
  }

  save() {
    if (this.form.valid) this.ref.close(this.form.value);
  }
  close() {
    this.ref.close();
  }
}
