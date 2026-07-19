import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PoDetailComponent } from './po-detail.component';
import { InventoryService } from '../shared/inventory.service';
import { ActivityService } from '../../shared/service/activity.service';
import { PurchaseOrder } from '../shared/inventory.models';

const mockPO: PurchaseOrder = {
  id: 1,
  orderNumber: 'PO-2026-001',
  supplier: { id: 10, name: 'PT Maju Bersama' },
  warehouse: { id: 1, name: 'Gudang Utama' },
  status: 'DRAFT',
  orderDate: '2026-01-01T00:00:00Z',
  expectedDate: '2026-03-01T00:00:00Z',
  totalAmount: 15000000,
  notes: 'Urgent restock',
  createdAt: '2026-01-01T00:00:00Z',
  items: [
    { id: 101, variantId: 1001, variantSku: 'TSH-BLK-M', variantSize: 'M', variantColor: 'Black', productName: 'Classic Tee', quantityOrdered: 100, quantityReceived: 0, unitCost: 50000, totalCost: 5000000 },
    { id: 102, variantId: 1002, variantSku: 'TSH-BLK-L', variantSize: 'L', variantColor: 'Black', productName: 'Classic Tee', quantityOrdered: 200, quantityReceived: 0, unitCost: 50000, totalCost: 10000000 },
  ],
};

describe('PoDetailComponent', () => {
  let fixture: ComponentFixture<PoDetailComponent>;
  let el: HTMLElement;
  let api: jasmine.SpyObj<InventoryService>;
  let feed: jasmine.SpyObj<ActivityService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<InventoryService>('InventoryService', [
      'getPurchaseOrder', 'updatePOStatus', 'receivePO', 'cancelPO',
    ]);
    api.getPurchaseOrder.and.returnValue(of(mockPO));
    api.updatePOStatus.and.returnValue(of(mockPO));
    api.receivePO.and.returnValue(of(mockPO));
    api.cancelPO.and.returnValue(of(undefined));

    feed = jasmine.createSpyObj<ActivityService>('ActivityService', ['log']);

    TestBed.configureTestingModule({
      imports: [PoDetailComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: '1' } } } },
        { provide: InventoryService, useValue: api },
        { provide: ActivityService, useValue: feed },
      ],
    });

    fixture = TestBed.createComponent(PoDetailComponent);
    el = fixture.nativeElement;
  });

  // ── Loading / data / error ──────────────────────────────────

  it('renders PO data after successful load', () => {
    fixture.detectChanges();
    expect(el.textContent).toContain('PO-2026-001');
    expect(el.querySelector('mat-spinner')).toBeFalsy();
  });

  it('shows error state when getPurchaseOrder fails', () => {
    api.getPurchaseOrder.and.returnValue(throwError(() => ({ error: { message: 'Not found' } })));
    fixture = TestBed.createComponent(PoDetailComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
    expect(el.querySelector('omp-error-state')).toBeTruthy();
    expect(el.querySelector('mat-spinner')).toBeFalsy();
  });

  it('initializes receiveQty to 0 for each item', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.receiveQty[101]).toBe(0);
    expect(fixture.componentInstance.receiveQty[102]).toBe(0);
  });

  // ── statusColor ──────────────────────────────────────────────

  it('statusColor returns correct chip palette for known statuses', () => {
    fixture.detectChanges();
    const c = fixture.componentInstance.statusColor;
    expect(c('DRAFT')).toBeUndefined();
    expect(c('SENT')).toBe('accent');
    expect(c('PARTIALLY_RECEIVED')).toBe('primary');
    expect(c('RECEIVED')).toBe('primary');
    expect(c('CANCELLED')).toBe('warn');
  });

  // ── updateStatus ─────────────────────────────────────────────

  it('updateStatus calls API and logs feed on success', () => {
    fixture.detectChanges();
    fixture.componentInstance.updateStatus('SENT');

    expect(api.updatePOStatus).toHaveBeenCalledWith(1, 'SENT');
    expect(feed.log).toHaveBeenCalledWith('inventory', jasmine.stringContaining('Status pesanan diperbarui'), 'info');
  });

  it('updateStatus logs error feed on failure', () => {
    api.updatePOStatus.and.returnValue(throwError(() => ({ error: { message: 'Invalid' } })));
    fixture.detectChanges();

    fixture.componentInstance.updateStatus('SENT');

    expect(feed.log).toHaveBeenCalledWith('inventory', jasmine.stringContaining('Gagal memperbarui'), 'err');
  });

  // ── receive ──────────────────────────────────────────────────

  it('receive does nothing when no qty entered', () => {
    fixture.detectChanges();
    fixture.componentInstance.receive();
    expect(api.receivePO).not.toHaveBeenCalled();
  });

  it('receive sends items with qty > 0 and logs success', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.receiveQty[101] = 10;

    comp.receive();

    expect(api.receivePO).toHaveBeenCalledWith(1, [{ itemId: 101, quantityReceived: 10 }]);
    expect(feed.log).toHaveBeenCalledWith('inventory', jasmine.stringContaining('Item diterima'), 'ok');
  });

  it('receive logs error feed on failure', () => {
    api.receivePO.and.returnValue(throwError(() => ({ error: { message: 'Warehouse full' } })));
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.receiveQty[101] = 5;

    comp.receive();

    expect(feed.log).toHaveBeenCalledWith('inventory', jasmine.stringContaining('Gagal menerima item'), 'err');
  });

  // ── cancel ───────────────────────────────────────────────────

  it('cancel sets status locally and logs feed', () => {
    fixture.detectChanges();

    fixture.componentInstance.cancel();

    expect(api.cancelPO).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.po()!.status).toBe('CANCELLED');
    expect(feed.log).toHaveBeenCalledWith('inventory', jasmine.stringContaining('Pesanan dibatalkan'), 'warn');
  });

  it('cancel logs error feed on failure', () => {
    api.cancelPO.and.returnValue(throwError(() => ({ error: { message: 'Already processed' } })));
    fixture.detectChanges();

    fixture.componentInstance.cancel();

    expect(feed.log).toHaveBeenCalledWith('inventory', jasmine.stringContaining('Gagal membatalkan pesanan'), 'err');
  });
});
