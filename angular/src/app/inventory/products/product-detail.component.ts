import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from '../shared/inventory.service';
import { Product, ProductVariant } from '../shared/inventory.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="inv-page">
      <a routerLink="/inventory/products" class="back">← Kembali ke Produk</a>

      @if (loading()) {
        <mat-spinner diameter="40" style="margin:40px auto" />
      } @else if (product()) {
        <mat-card class="product-info">
          <mat-card-header
            ><mat-card-title>{{
              product()!.name
            }}</mat-card-title></mat-card-header
          >
          <mat-card-content>
            <div class="info-grid">
              <div><strong>Merek:</strong> {{ product()!.brand || '-' }}</div>
              <div>
                <strong>Kategori:</strong> {{ product()!.categoryName }}
              </div>
              <div><strong>Gender:</strong> {{ product()!.gender || '-' }}</div>
              <div>
                <strong>Material:</strong> {{ product()!.material || '-' }}
              </div>
              <div>
                <strong>Harga Dasar:</strong>
                {{
                  product()!.basePrice | currency: 'IDR' : 'symbol' : '1.0-0'
                }}
              </div>
              <div>
                <strong>Status:</strong>
                <mat-chip
                  [color]="product()!.status === 'ACTIVE' ? 'primary' : 'warn'"
                  selected
                  >{{ product()!.status }}</mat-chip
                >
              </div>
            </div>
            @if (product()!.careInstructions) {
              <p><strong>Perawatan:</strong> {{ product()!.careInstructions }}</p>
            }
          </mat-card-content>
        </mat-card>

        <div class="section-header">
          <h3>Varian ({{ variants().length }})</h3>
          <button
            mat-raised-button
            color="primary"
            (click)="openVariantDialog()"
          >
            <mat-icon>add</mat-icon> Tambah Varian
          </button>
        </div>

        @if (variants().length === 0) {
          <p class="empty">Belum ada varian.</p>
        } @else {
          <table mat-table [dataSource]="variants()" class="mat-elevation-z1">
            <ng-container matColumnDef="size"
              ><th mat-header-cell *matHeaderCellDef>Ukuran</th>
              <td mat-cell *matCellDef="let v">{{ v.size }}</td></ng-container
            >
            <ng-container matColumnDef="color"
              ><th mat-header-cell *matHeaderCellDef>Warna</th>
              <td mat-cell *matCellDef="let v">
                <span
                  class="swatch"
                  [style.background]="v.colorHex || '#ccc'"
                ></span>
                {{ v.color }}
              </td></ng-container
            >
            <ng-container matColumnDef="sku"
              ><th mat-header-cell *matHeaderCellDef>SKU</th>
              <td mat-cell *matCellDef="let v">{{ v.sku }}</td></ng-container
            >
            <ng-container matColumnDef="cost"
              ><th mat-header-cell *matHeaderCellDef>Modal</th>
              <td mat-cell *matCellDef="let v">
                {{ v.costPrice | currency: 'IDR' : 'symbol' : '1.0-0' }}
              </td></ng-container
            >
            <ng-container matColumnDef="selling"
              ><th mat-header-cell *matHeaderCellDef>Jual</th>
              <td mat-cell *matCellDef="let v">
                {{ v.sellingPrice | currency: 'IDR' : 'symbol' : '1.0-0' }}
              </td></ng-container
            >
            <ng-container matColumnDef="stock"
              ><th mat-header-cell *matHeaderCellDef>Stok</th>
              <td mat-cell *matCellDef="let v">
                <span
                  [class.low]="
                    v.stockQuantity <= v.lowStockThreshold &&
                    v.stockQuantity > 0
                  "
                  [class.out]="v.stockQuantity === 0"
                  >{{ v.stockQuantity }}</span
                >
              </td></ng-container
            >
            <ng-container matColumnDef="threshold"
              ><th mat-header-cell *matHeaderCellDef>Ambang</th>
              <td mat-cell *matCellDef="let v">
                {{ v.lowStockThreshold }}
              </td></ng-container
            >
            <tr mat-header-row *matHeaderRowDef="varColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: varColumns"></tr>
          </table>
        }
      }
    </div>
  `,
  styleUrls: ['./product-detail.component.css'],
})
export class ProductDetailComponent {
  private api = inject(InventoryService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  product = signal<Product | null>(null);
  variants = signal<ProductVariant[]>([]);
  loading = signal(true);
  varColumns = [
    'size',
    'color',
    'sku',
    'cost',
    'selling',
    'stock',
    'threshold',
  ];

  constructor() {
    const id = +this.route.snapshot.params['id'];
    this.api.getProduct(id).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.api.getVariants(id).subscribe((v) => this.variants.set(v));
  }

  openVariantDialog() {
    import('./variant-dialog.component').then(({ VariantDialogComponent }) => {
      const ref = this.dialog.open(VariantDialogComponent, { width: '500px' });
      ref.afterClosed().subscribe((result) => {
        if (result) {
          this.api.createVariant(this.product()!.id, result).subscribe({
            next: () => {
              this.refreshVariants();
              this.snack.open('Varian ditambahkan', 'OK', { duration: 3000 });
            },
            error: (err) =>
              this.snack.open(err.error?.message || 'Galat', 'OK', {
                duration: 5000,
              }),
          });
        }
      });
    });
  }

  refreshVariants() {
    this.api
      .getVariants(this.product()!.id)
      .subscribe((v) => this.variants.set(v));
  }
}
