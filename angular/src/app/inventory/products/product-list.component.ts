import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from '../shared/inventory.service';
import { ActivityService } from '../../shared/service/activity.service';
import { Product, Category, ProductQuery } from '../shared/inventory.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'inventory-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="inv-page">
      <div class="page-header">
        <h2>Produk</h2>
        <button mat-raised-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon> Tambah Produk
        </button>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline" style="flex:2"
          ><mat-label>Cari</mat-label
          ><input matInput [(ngModel)]="search" (keyup.enter)="load()"
        /></mat-form-field>
        <mat-form-field appearance="outline" style="flex:1"
          ><mat-label>Kategori</mat-label
          ><mat-select [(ngModel)]="filterCategory" (selectionChange)="load()"
            ><mat-option [value]="null">Semua</mat-option>
            @for (c of categories(); track c.id) {
              <mat-option [value]="c.id">{{ c.name }}</mat-option>
            }
          </mat-select></mat-form-field
        >
        <mat-form-field appearance="outline" style="flex:1"
          ><mat-label>Status</mat-label
          ><mat-select [(ngModel)]="filterStatus" (selectionChange)="load()"
            ><mat-option [value]="null">Semua</mat-option
            ><mat-option value="DRAFT">Draf</mat-option
            ><mat-option value="ACTIVE">Aktif</mat-option
            ><mat-option value="ARCHIVED">Arsip</mat-option></mat-select
          ></mat-form-field
        >
      </div>

      @if (loading()) {
        <mat-spinner diameter="40" style="margin:40px auto" />
      } @else if (data().length === 0) {
        <p class="empty">
          Belum ada produk. Klik "Tambah Produk" untuk memulai.
        </p>
      } @else {
        <table mat-table [dataSource]="data()" class="mat-elevation-z1">
          <ng-container matColumnDef="name"
            ><th mat-header-cell *matHeaderCellDef>Nama</th>
            <td mat-cell *matCellDef="let p">
              <a [routerLink]="['/inventory/products', p.id]">{{ p.name }}</a>
            </td></ng-container
          >
          <ng-container matColumnDef="brand"
            ><th mat-header-cell *matHeaderCellDef>Merek</th>
            <td mat-cell *matCellDef="let p">
              {{ p.brand || '-' }}
            </td></ng-container
          >
          <ng-container matColumnDef="category"
            ><th mat-header-cell *matHeaderCellDef>Kategori</th>
            <td mat-cell *matCellDef="let p">
              {{ p.categoryName }}
            </td></ng-container
          >
          <ng-container matColumnDef="price"
            ><th mat-header-cell *matHeaderCellDef>Harga Dasar</th>
            <td mat-cell *matCellDef="let p">
              {{ p.basePrice | currency: 'IDR' : 'symbol' : '1.0-0' }}
            </td></ng-container
          >
          <ng-container matColumnDef="variants"
            ><th mat-header-cell *matHeaderCellDef>Varian</th>
            <td mat-cell *matCellDef="let p">
              {{ p.variantCount }}
            </td></ng-container
          >
          <ng-container matColumnDef="status"
            ><th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let p">
              <mat-chip [color]="statusColor(p.status)" selected>{{
                p.status
              }}</mat-chip>
            </td></ng-container
          >
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
        <mat-paginator
          [length]="total()"
          [pageSize]="20"
          (page)="onPage($event)"
        />
      }
    </div>
  `,
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  private readonly api = inject(InventoryService);
  private readonly dialog = inject(MatDialog);
  private readonly feed = inject(ActivityService);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);

  data = signal<Product[]>([]);
  total = signal(0);
  loading = signal(true);
  categories = signal<Category[]>([]);
  search = '';
  filterCategory: number | null = null;
  filterStatus: string | null = null;
  columns = ['name', 'brand', 'category', 'price', 'variants', 'status'];

  ngOnInit() {
    this.api.getCategories().subscribe((c) => this.categories.set(c));
    this.load();
  }

  load(page = 0) {
    this.loading.set(true);
    const params: ProductQuery = { page, size: 20 };
    if (this.search) params.q = this.search;
    if (this.filterCategory) params.categoryId = this.filterCategory;
    this.api.getProducts(params).subscribe({
      next: (r) => {
        this.data.set(r.content);
        this.total.set(r.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPage(e: PageEvent) {
    this.load(e.pageIndex);
  }

  statusColor(s: string) {
    return s === 'ACTIVE' ? 'primary' : s === 'DRAFT' ? 'accent' : 'warn';
  }

  openDialog() {
    import('./product-dialog.component').then(({ ProductDialogComponent }) => {
      const ref = this.dialog.open(ProductDialogComponent, {
        width: '500px',
        data: { categories: this.categories() },
      });
      ref.afterClosed().subscribe((result) => {
        if (result) {
          this.api.createProduct(result).subscribe({
            next: (p) => {
              this.load();
              this.snack.open('Produk dibuat', 'OK', { duration: 3000 });
              this.feed.log('inventory', `Produk dibuat: ${p.name}`, 'ok');
            },
            error: (err) => {
              this.snack.open(err.error?.message || 'Galat', 'OK', {
                duration: 5000,
              });
              this.feed.log('inventory', `Gagal membuat produk: ${err.error?.message || 'Galat'}`, 'err');
            },
          });
        }
      });
    });
  }
}
