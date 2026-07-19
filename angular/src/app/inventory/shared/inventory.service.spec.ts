import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { InventoryService } from './inventory.service';
import type {
  ProductQuery,
  MovementQuery,
  ProductPayload,
  PurchaseOrderPayload,
  StockAdjustPayload,
  PageResponse,
  Product,
  PurchaseOrder,
  StockMovement,
} from './inventory.models';

const emptyPage = <T>(): PageResponse<T> => ({
  content: [],
  page: 0,
  size: 0,
  totalElements: 0,
  totalPages: 0,
});

describe('InventoryService', () => {
  let service: InventoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InventoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  describe('query param serialization', () => {
    it('drops undefined and null query fields from getProducts()', () => {
      const params: ProductQuery = {
        page: 0,
        size: 20,
        q: undefined,
        categoryId: null as unknown as number,
      };
      service.getProducts(params).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/products' && r.method === 'GET',
      );
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('20');
      expect(req.request.params.has('q')).toBeFalse();
      expect(req.request.params.has('categoryId')).toBeFalse();
      req.flush(emptyPage<Product>());
    });

    it('includes categoryId and status when provided', () => {
      service.getProducts({ categoryId: 7, status: 'ACTIVE' }).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/products' && r.method === 'GET',
      );
      expect(req.request.params.get('categoryId')).toBe('7');
      expect(req.request.params.get('status')).toBe('ACTIVE');
      req.flush(emptyPage<Product>());
    });

    it('serializes empty query as no params for getMovements()', () => {
      const params: MovementQuery = {};
      service.getMovements(params).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/stock/movements' && r.method === 'GET',
      );
      expect(req.request.params.keys().length).toBe(0);
      req.flush(emptyPage<StockMovement>());
    });
  });

  describe('typed POST payloads', () => {
    it('forwards ProductPayload body verbatim to createProduct()', () => {
      const payload: ProductPayload = {
        name: 'Kemeja Linen',
        categoryId: 3,
        basePrice: 150000,
      };
      service.createProduct(payload).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/products' && r.method === 'POST',
      );
      expect(req.request.body).toEqual(payload);
      req.flush({} as Product);
    });

    it('forwards PurchaseOrderPayload body verbatim to createPurchaseOrder()', () => {
      const payload: PurchaseOrderPayload = {
        supplierId: 11,
        warehouseId: 2,
        items: [{ variantId: 99, quantity: 5, unitCost: 12000 }],
      };
      service.createPurchaseOrder(payload).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/purchase-orders' && r.method === 'POST',
      );
      expect(req.request.body).toEqual(payload);
      req.flush({} as PurchaseOrder);
    });

    it('forwards StockAdjustPayload body verbatim to adjustStock()', () => {
      const payload: StockAdjustPayload = {
        variantId: 1,
        warehouseId: 2,
        quantity: -3,
        reason: 'Damaged in transit',
      };
      service.adjustStock(payload).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/stock/adjust' && r.method === 'POST',
      );
      expect(req.request.body).toEqual(payload);
      req.flush(null);
    });
  });

  describe('typed PUT status', () => {
    it('sends { status } body to updatePOStatus()', () => {
      service.updatePOStatus(42, 'SENT').subscribe();

      const req = httpMock.expectOne(
        (r) =>
          r.url === '/api/purchase-orders/42/status' && r.method === 'PUT',
      );
      expect(req.request.body).toEqual({ status: 'SENT' });
      req.flush({} as PurchaseOrder);
    });
  });

  describe('receivePO()', () => {
    it('posts { items } to the receive endpoint with the given items', () => {
      const items = [
        { itemId: 1, quantityReceived: 10 },
        { itemId: 2, quantityReceived: 5 },
      ];
      service.receivePO(7, items).subscribe();

      const req = httpMock.expectOne(
        (r) =>
          r.url === '/api/purchase-orders/7/receive' && r.method === 'POST',
      );
      expect(req.request.body).toEqual({ items });
      req.flush({} as PurchaseOrder);
    });
  });
});