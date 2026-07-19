import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PoListComponent } from './po-list.component';
import { InventoryService } from '../shared/inventory.service';
import { PageResponse, PurchaseOrder } from '../shared/inventory.models';

const mockPage: PageResponse<PurchaseOrder> = {
  content: [
    { id: 1, orderNumber: 'PO-001', supplier: { id: 10, name: 'PT A' }, warehouse: { id: 1, name: 'WH-1' }, status: 'DRAFT' as const, orderDate: '2026-01-01', totalAmount: 5_000_000, createdAt: '2026-01-01', items: [] },
    { id: 2, orderNumber: 'PO-002', supplier: { id: 20, name: 'PT B' }, warehouse: { id: 2, name: 'WH-2' }, status: 'SENT' as const, orderDate: '2026-02-01', totalAmount: 10_000_000, createdAt: '2026-02-01', items: [] },
  ],
  page: 0,
  size: 20,
  totalElements: 42,
  totalPages: 3,
};

describe('PoListComponent', () => {
  let fixture: ComponentFixture<PoListComponent>;
  let el: HTMLElement;
  let api: jasmine.SpyObj<InventoryService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<InventoryService>('InventoryService', ['getPurchaseOrders']);
    api.getPurchaseOrders.and.returnValue(of(mockPage));

    TestBed.configureTestingModule({
      imports: [PoListComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({})), snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: InventoryService, useValue: api },
      ],
    });

    fixture = TestBed.createComponent(PoListComponent);
    el = fixture.nativeElement;
  });

  it('renders PO list after successful load', () => {
    fixture.detectChanges();
    expect(el.textContent).toContain('PO-001');
    expect(el.textContent).toContain('PO-002');
    expect(el.querySelector('mat-spinner')).toBeFalsy();
  });

  it('shows total count', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.total()).toBe(42);
  });

  it('shows error state on load failure', () => {
    api.getPurchaseOrders.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
    fixture = TestBed.createComponent(PoListComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
    expect(el.querySelector('omp-error-state')).toBeTruthy();
  });

  it('shows empty state when no POs returned', () => {
    api.getPurchaseOrders.and.returnValue(of({ ...mockPage, content: [], totalElements: 0 }));
    fixture = TestBed.createComponent(PoListComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
    expect(el.querySelector('omp-empty-state')).toBeTruthy();
  });

  it('load() calls API with page number', () => {
    fixture.detectChanges();
    api.getPurchaseOrders.calls.reset();

    fixture.componentInstance.load(2);

    expect(api.getPurchaseOrders).toHaveBeenCalledWith({ page: 2, size: 20 });
  });
});
