import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'product-dialog',
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
    <h2 mat-dialog-title>{{ data?.product ? 'Edit' : 'Add' }} Product</h2>
    <form [formGroup]="form" (ngSubmit)="save()" mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Name</mat-label><input matInput formControlName="name"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Description</mat-label
        ><textarea matInput formControlName="description" rows="3"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Brand</mat-label><input matInput formControlName="brand"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Category</mat-label
        ><mat-select formControlName="categoryId">
          @for (c of data.categories; track c.id) {
            <mat-option [value]="c.id">{{ c.name }}</mat-option>
          }
        </mat-select></mat-form-field
      >
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Base Price</mat-label
        ><input matInput type="number" formControlName="basePrice"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Gender</mat-label
        ><mat-select formControlName="gender"
          ><mat-option value="">N/A</mat-option
          ><mat-option value="MEN">Men</mat-option
          ><mat-option value="WOMEN">Women</mat-option
          ><mat-option value="KIDS">Kids</mat-option
          ><mat-option value="UNISEX">Unisex</mat-option></mat-select
        ></mat-form-field
      >
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Material</mat-label
        ><input matInput formControlName="material"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Care Instructions</mat-label
        ><textarea
          matInput
          formControlName="careInstructions"
          rows="2"
        ></textarea>
      </mat-form-field>
      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="close()">Cancel</button>
        <button mat-raised-button color="primary" [disabled]="form.invalid">
          Save
        </button>
      </div>
    </form>
  `,
})
export class ProductDialogComponent {
  form: ReturnType<typeof this.buildForm>;

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.form = this.buildForm();
    if (data.product) this.form.patchValue(data.product);
  }

  private buildForm() {
    return this.fb.group({
      name: ['', Validators.required],
      description: [''],
      brand: [''],
      categoryId: [null, Validators.required],
      basePrice: [0],
      gender: [''],
      material: [''],
      careInstructions: [''],
    });
  }

  save() {
    if (this.form.valid) this.ref.close(this.form.value);
  }
  close() {
    this.ref.close();
  }
}
