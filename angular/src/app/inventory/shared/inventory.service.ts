import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  Product,
  ProductVariant,
  Supplier,
  PurchaseOrder,
  StockMovement,
  Alert,
  DashboardStats,
  PageResponse,
  Category,
  Warehouse,
} from './inventory.models';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);
  private base = '/api';

  // Dashboard
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/dashboard/stats`);
  }

  // Products
  getProducts(params?: any): Observable<PageResponse<Product>> {
    return this.http.get<PageResponse<Product>>(`${this.base}/products`, {
      params,
    });
  }
  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.base}/products/${id}`);
  }
  createProduct(data: any): Observable<Product> {
    return this.http.post<Product>(`${this.base}/products`, data);
  }
  updateProduct(id: number, data: any): Observable<Product> {
    return this.http.put<Product>(`${this.base}/products/${id}`, data);
  }
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/products/${id}`);
  }

  // Variants
  getVariants(productId: number): Observable<ProductVariant[]> {
    return this.http.get<ProductVariant[]>(
      `${this.base}/products/${productId}/variants`,
    );
  }
  createVariant(productId: number, data: any): Observable<ProductVariant> {
    return this.http.post<ProductVariant>(
      `${this.base}/products/${productId}/variants`,
      data,
    );
  }
  updateVariant(
    productId: number,
    id: number,
    data: any,
  ): Observable<ProductVariant> {
    return this.http.put<ProductVariant>(
      `${this.base}/products/${productId}/variants/${id}`,
      data,
    );
  }
  deleteVariant(productId: number, id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/products/${productId}/variants/${id}`,
    );
  }

  // Categories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.base}/categories`);
  }

  // Suppliers
  getSuppliers(search?: string): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.base}/suppliers`, {
      params: search ? { search } : {},
    });
  }
  createSupplier(data: any): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.base}/suppliers`, data);
  }
  updateSupplier(id: number, data: any): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.base}/suppliers/${id}`, data);
  }
  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/suppliers/${id}`);
  }

  // Warehouses
  getWarehouses(): Observable<Warehouse[]> {
    return this.http.get<Warehouse[]>(`${this.base}/warehouses`);
  }

  // Purchase Orders
  getPurchaseOrders(params?: any): Observable<PageResponse<PurchaseOrder>> {
    return this.http.get<PageResponse<PurchaseOrder>>(
      `${this.base}/purchase-orders`,
      { params },
    );
  }
  getPurchaseOrder(id: number): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(`${this.base}/purchase-orders/${id}`);
  }
  createPurchaseOrder(data: any): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.base}/purchase-orders`, data);
  }
  updatePOStatus(id: number, status: string): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(
      `${this.base}/purchase-orders/${id}/status`,
      { status },
    );
  }
  receivePO(
    id: number,
    items: { itemId: number; quantityReceived: number }[],
  ): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(
      `${this.base}/purchase-orders/${id}/receive`,
      { items },
    );
  }
  cancelPO(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/purchase-orders/${id}/cancel`, {});
  }

  // Stock
  getVariantStock(variantId: number): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(
      `${this.base}/stock/variant/${variantId}`,
    );
  }
  getMovements(params?: any): Observable<PageResponse<StockMovement>> {
    return this.http.get<PageResponse<StockMovement>>(
      `${this.base}/stock/movements`,
      { params },
    );
  }
  adjustStock(data: any): Observable<void> {
    return this.http.post<void>(`${this.base}/stock/adjust`, data);
  }
  transferStock(data: any): Observable<void> {
    return this.http.post<void>(`${this.base}/stock/transfer`, data);
  }

  // Alerts
  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.base}/stock/alerts`);
  }
  acknowledgeAlert(id: number): Observable<void> {
    return this.http.put<void>(
      `${this.base}/stock/alerts/${id}/acknowledge`,
      {},
    );
  }
}
