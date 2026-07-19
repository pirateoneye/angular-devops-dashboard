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
import { MatButtonModule } from '@angular/material/button';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    <h2 mat-dialog-title>{{ data?.supplier ? 'Edit' : 'Tambah' }} Pemasok</h2>
    <form [formGroup]="f" (ngSubmit)="save()" mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Nama *</mat-label><input matInput formControlName="name"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Kode *</mat-label><input matInput formControlName="code"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Kontak Person</mat-label
        ><input matInput formControlName="contactPerson"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Email</mat-label
        ><input matInput formControlName="email" type="email"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Telepon</mat-label><input matInput formControlName="phone"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Alamat</mat-label
        ><input matInput formControlName="addressLine1"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Kota</mat-label><input matInput formControlName="city"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Provinsi</mat-label><input matInput formControlName="state"
      /></mat-form-field>
      <mat-form-field appearance="outline" style="width:100%"
        ><mat-label>Catatan</mat-label
        ><textarea matInput formControlName="notes" rows="2"></textarea>
      </mat-form-field>
      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="close()">Batal</button
        ><button mat-raised-button color="primary" [disabled]="f.invalid">
          Simpan
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
