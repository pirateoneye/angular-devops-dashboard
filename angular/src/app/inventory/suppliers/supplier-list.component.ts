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
  ],
  template: `
    <div class="inv-page">
      <div class="page-header">
        <h2>Suppliers</h2>
        <button mat-raised-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon> Add Supplier
        </button>
      </div>
      @if (loading()) {
        <mat-spinner diameter="40" style="margin:40px auto" />
      } @else if (data().length === 0) {
        <p class="empty">No suppliers yet.</p>
      } @else {
        <table mat-table [dataSource]="data()" class="mat-elevation-z1">
          <ng-container matColumnDef="code"
            ><th mat-header-cell *matHeaderCellDef>Code</th>
            <td mat-cell *matCellDef="let s">{{ s.code }}</td></ng-container
          >
          <ng-container matColumnDef="name"
            ><th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let s">{{ s.name }}</td></ng-container
          >
          <ng-container matColumnDef="contact"
            ><th mat-header-cell *matHeaderCellDef>Contact</th>
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
            ><th mat-header-cell *matHeaderCellDef>Phone</th>
            <td mat-cell *matCellDef="let s">
              {{ s.phone || '-' }}
            </td></ng-container
          >
          <ng-container matColumnDef="active"
            ><th mat-header-cell *matHeaderCellDef>Active</th>
            <td mat-cell *matCellDef="let s">
              <mat-chip [color]="s.isActive ? 'primary' : 'warn'" selected>{{
                s.isActive ? 'Yes' : 'No'
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
  styles: [
    `
      .inv-page {
        padding: 24px;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .empty {
        text-align: center;
        color: #888;
        padding: 40px;
      }
      table {
        width: 100%;
      }
    `,
  ],
})
export class SupplierListComponent implements OnInit {
  private api = inject(InventoryService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  data = signal<Supplier[]>([]);
  loading = signal(true);
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
      },
      error: () => this.loading.set(false),
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
              this.snack.open(supplier ? 'Updated' : 'Created', 'OK', {
                duration: 3000,
              });
            },
            error: (e) =>
              this.snack.open(e.error?.message || 'Error', 'OK', {
                duration: 5000,
              }),
          });
        });
      },
    );
  }
}
