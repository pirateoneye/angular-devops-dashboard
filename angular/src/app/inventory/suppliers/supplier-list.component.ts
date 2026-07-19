import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from '../shared/inventory.service';
import { Supplier } from '../shared/inventory.models';
import { EmptyStateComponent } from '../../shared/component/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/component/error-state/error-state.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'inventory-supplier-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="inv-page">
      <div class="page-header">
        <h2>Pemasok</h2>
        <button mat-raised-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon> Tambah Pemasok
        </button>
      </div>
      @if (loading()) {
        <mat-spinner diameter="40" style="margin:40px auto" />
      } @else if (error()) {
        <omp-error-state message="Gagal memuat pemasok." />
      } @else if (data().length === 0) {
        <omp-empty-state message="Belum ada pemasok." icon="local_shipping" />
      } @else {
        <table mat-table [dataSource]="data()" class="mat-elevation-z1">
          <ng-container matColumnDef="code"
            ><th mat-header-cell *matHeaderCellDef>Kode</th>
            <td mat-cell *matCellDef="let s">{{ s.code }}</td></ng-container
          >
          <ng-container matColumnDef="name"
            ><th mat-header-cell *matHeaderCellDef>Nama</th>
            <td mat-cell *matCellDef="let s">{{ s.name }}</td></ng-container
          >
          <ng-container matColumnDef="contact"
            ><th mat-header-cell *matHeaderCellDef>Kontak</th>
            <td mat-cell *matCellDef="let s">
              {{ s.contactPerson || '-' }}
            </td></ng-container
          >
          <ng-container matColumnDef="email"
            ><th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let s">
              {{ s.email || '-' }}
            </td></ng-container
          >
          <ng-container matColumnDef="phone"
            ><th mat-header-cell *matHeaderCellDef>Telepon</th>
            <td mat-cell *matCellDef="let s">
              {{ s.phone || '-' }}
            </td></ng-container
          >
          <ng-container matColumnDef="active"
            ><th mat-header-cell *matHeaderCellDef>Aktif</th>
            <td mat-cell *matCellDef="let s">
              <mat-chip [color]="s.isActive ? 'primary' : 'warn'" selected>{{
                s.isActive ? 'Ya' : 'Tidak'
              }}</mat-chip>
            </td></ng-container
          >
          <ng-container matColumnDef="actions"
            ><th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let s">
              <button mat-icon-button (click)="openDialog(s)">
                <mat-icon>edit</mat-icon>
              </button>
            </td></ng-container
          >
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      }
    </div>
  `,
  styleUrls: ['./supplier-list.component.css'],
})
export class SupplierListComponent implements OnInit {
  private api = inject(InventoryService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  data = signal<Supplier[]>([]);
  loading = signal(true);
  error = signal(false);
  columns = ['code', 'name', 'contact', 'email', 'phone', 'active', 'actions'];

  ngOnInit() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.api.getSuppliers().subscribe({
      next: (s) => {
        this.data.set(s);
        this.loading.set(false);
        this.error.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  openDialog(supplier?: Supplier) {
    import('./supplier-dialog.component').then(
      ({ SupplierDialogComponent }) => {
        const ref = this.dialog.open(SupplierDialogComponent, {
          width: '500px',
          data: { supplier },
        });
        ref.afterClosed().subscribe((r) => {
          if (!r) return;
          const req = supplier
            ? this.api.updateSupplier(supplier.id, r)
            : this.api.createSupplier(r);
          req.subscribe({
            next: () => {
              this.load();
              this.snack.open(supplier ? 'Diperbarui' : 'Dibuat', 'OK', {
                duration: 3000,
              });
            },
            error: (e) =>
              this.snack.open(e.error?.message || 'Galat', 'OK', {
                duration: 5000,
              }),
          });
        });
      },
    );
  }
}
