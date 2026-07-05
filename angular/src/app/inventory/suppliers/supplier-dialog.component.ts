import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'supplier-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data?.supplier ? 'Edit' : 'Add' }} Supplier</h2>
    <form [formGroup]="f" (ngSubmit)="save()" mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Name *</mat-label><input matInput formControlName="name"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Code *</mat-label><input matInput formControlName="code"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Contact Person</mat-label
        ><input matInput formControlName="contactPerson"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Email</mat-label
        ><input matInput formControlName="email" type="email"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Phone</mat-label><input matInput formControlName="phone"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Address</mat-label
        ><input matInput formControlName="addressLine1"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>City</mat-label><input matInput formControlName="city"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>State</mat-label><input matInput formControlName="state"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Notes</mat-label
        ><textarea matInput formControlName="notes" rows="2"></textarea>
      </mat-form-field>
      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="close()">Cancel</button
        ><button mat-raised-button color="primary" [disabled]="f.invalid">
          Save
        </button>
      </div>
    </form>
  `,
})
export class SupplierDialogComponent {
  f: ReturnType<typeof this.buildForm>;

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<SupplierDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.f = this.buildForm();
    if (data.supplier) this.f.patchValue(data.supplier);
  }

  private buildForm() {
    return this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      contactPerson: [''],
      email: [''],
      phone: [''],
      addressLine1: [''],
      city: [''],
      state: [''],
      country: ['ID'],
      postalCode: [''],
      notes: [''],
    });
  }

  save() {
    if (this.f.valid) this.ref.close(this.f.value);
  }
  close() {
    this.ref.close();
  }
}
