import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./products/product-list.component').then(
        (m) => m.ProductListComponent,
      ),
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./products/product-detail.component').then(
        (m) => m.ProductDetailComponent,
      ),
  },
  {
    path: 'suppliers',
    loadComponent: () =>
      import('./suppliers/supplier-list.component').then(
        (m) => m.SupplierListComponent,
      ),
  },
  {
    path: 'purchase-orders',
    loadComponent: () =>
      import('./purchase-orders/po-list.component').then(
        (m) => m.PoListComponent,
      ),
  },
  {
    path: 'purchase-orders/new',
    loadComponent: () =>
      import('./purchase-orders/po-create.component').then(
        (m) => m.PoCreateComponent,
      ),
  },
  {
    path: 'purchase-orders/:id',
    loadComponent: () =>
      import('./purchase-orders/po-detail.component').then(
        (m) => m.PoDetailComponent,
      ),
  },
  {
    path: 'stock',
    loadComponent: () =>
      import('./stock/stock-view.component').then((m) => m.StockViewComponent),
  },
  {
    path: 'stock/movements',
    loadComponent: () =>
      import('./stock/stock-movement-log.component').then(
        (m) => m.StockMovementLogComponent,
      ),
  },
  {
    path: 'alerts',
    loadComponent: () =>
      import('./stock/stock-alerts.component').then(
        (m) => m.StockAlertsComponent,
      ),
  },
  { path: '**', redirectTo: 'dashboard', pathMatch: 'full' },
];
