import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { MsvPaginationComponent } from './msv-pagination.component';
import { MSV_FORMS_CONFIG } from '../msv-forms.config';

describe('MsvPaginationComponent', () => {
  let component: MsvPaginationComponent;
  let fixture: ComponentFixture<MsvPaginationComponent>;

  const mockConfig = {
    validationMessages: {
      required: 'Field ini wajib diisi',
      email: 'Format email tidak valid',
      minLength: (min: number) => `Minimal ${min} karakter`,
      maxLength: (max: number) => `Maksimal ${max} karakter`,
      pattern: 'Format tidak valid'
    },
    loadingText: 'Processing...'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, MsvPaginationComponent],
      providers: [
        { provide: MSV_FORMS_CONFIG, useValue: mockConfig }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.totalItems).toBe(0);
    expect(component.pageSize).toBe(10);
    expect(component.currentPage).toBe(1);
    expect(component.pageSizeOptions).toEqual([10, 25, 50]);
  });

  it('should calculate total pages correctly', () => {
    component.totalItems = 100;
    component.pageSize = 10;
    expect(component.totalPages).toBe(10);

    component.totalItems = 95;
    component.pageSize = 10;
    expect(component.totalPages).toBe(10);

    component.totalItems = 101;
    component.pageSize = 10;
    expect(component.totalPages).toBe(11);
  });

  it('should return 1 page when totalItems is 0', () => {
    component.totalItems = 0;
    component.pageSize = 10;
    expect(component.totalPages).toBe(1);
  });

  it('should return 1 page when pageSize is 0', () => {
    component.totalItems = 100;
    component.pageSize = 0;
    expect(component.totalPages).toBe(1);
  });

  it('should identify first page correctly', () => {
    component.currentPage = 1;
    expect(component.isFirstPage).toBe(true);

    component.currentPage = 2;
    expect(component.isFirstPage).toBe(false);
  });

  it('should identify last page correctly', () => {
    component.totalItems = 100;
    component.pageSize = 10;
    component.currentPage = 10;
    expect(component.isLastPage).toBe(true);

    component.currentPage = 9;
    expect(component.isLastPage).toBe(false);
  });

  it('should calculate start item correctly', () => {
    component.totalItems = 100;
    component.pageSize = 10;
    component.currentPage = 1;
    expect(component.startItem).toBe(1);

    component.currentPage = 2;
    expect(component.startItem).toBe(11);

    component.currentPage = 5;
    expect(component.startItem).toBe(41);
  });

  it('should return 0 for start item when totalItems is 0', () => {
    component.totalItems = 0;
    component.pageSize = 10;
    component.currentPage = 1;
    expect(component.startItem).toBe(0);
  });

  it('should calculate end item correctly', () => {
    component.totalItems = 100;
    component.pageSize = 10;
    component.currentPage = 1;
    expect(component.endItem).toBe(10);

    component.currentPage = 2;
    expect(component.endItem).toBe(20);

    component.currentPage = 10;
    expect(component.endItem).toBe(100);
  });

  it('should not exceed totalItems for end item', () => {
    component.totalItems = 95;
    component.pageSize = 10;
    component.currentPage = 10;
    expect(component.endItem).toBe(95);
  });

  it('should emit pageChange when going to first page', () => {
    spyOn(component.pageChange, 'emit');
    component.totalItems = 100;
    component.pageSize = 10;
    component.currentPage = 5;

    component.goToFirstPage();

    expect(component.currentPage).toBe(1);
    expect(component.pageChange.emit).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10
    });
  });

  it('should not change page when already on first page', () => {
    spyOn(component.pageChange, 'emit');
    component.currentPage = 1;

    component.goToFirstPage();

    expect(component.pageChange.emit).not.toHaveBeenCalled();
  });

  it('should emit pageChange when going to previous page', () => {
    spyOn(component.pageChange, 'emit');
    component.totalItems = 100;
    component.pageSize = 10;
    component.currentPage = 5;

    component.goToPreviousPage();

    expect(component.currentPage).toBe(4);
    expect(component.pageChange.emit).toHaveBeenCalledWith({
      page: 4,
      pageSize: 10
    });
  });

  it('should not change page when on first page and going previous', () => {
    spyOn(component.pageChange, 'emit');
    component.currentPage = 1;

    component.goToPreviousPage();

    expect(component.pageChange.emit).not.toHaveBeenCalled();
  });

  it('should emit pageChange when going to next page', () => {
    spyOn(component.pageChange, 'emit');
    component.totalItems = 100;
    component.pageSize = 10;
    component.currentPage = 5;

    component.goToNextPage();

    expect(component.currentPage).toBe(6);
    expect(component.pageChange.emit).toHaveBeenCalledWith({
      page: 6,
      pageSize: 10
    });
  });

  it('should not change page when on last page and going next', () => {
    spyOn(component.pageChange, 'emit');
    component.totalItems = 100;
    component.pageSize = 10;
    component.currentPage = 10;

    component.goToNextPage();

    expect(component.pageChange.emit).not.toHaveBeenCalled();
  });

  it('should emit pageChange when going to last page', () => {
    spyOn(component.pageChange, 'emit');
    component.totalItems = 100;
    component.pageSize = 10;
    component.currentPage = 1;

    component.goToLastPage();

    expect(component.currentPage).toBe(10);
    expect(component.pageChange.emit).toHaveBeenCalledWith({
      page: 10,
      pageSize: 10
    });
  });

  it('should not change page when already on last page', () => {
    spyOn(component.pageChange, 'emit');
    component.totalItems = 100;
    component.pageSize = 10;
    component.currentPage = 10;

    component.goToLastPage();

    expect(component.pageChange.emit).not.toHaveBeenCalled();
  });

  it('should handle page size change and adjust current page', () => {
    spyOn(component.pageChange, 'emit');
    component.totalItems = 100;
    component.pageSize = 10;
    component.currentPage = 5; // Items 41-50

    const mockEvent = {
      target: { value: '25' }
    } as any;

    component.onPageSizeChange(mockEvent);

    expect(component.pageSize).toBe(25);
    // Item 41 should be on page 2 with pageSize 25 (items 26-50)
    expect(component.currentPage).toBe(2);
    expect(component.pageChange.emit).toHaveBeenCalledWith({
      page: 2,
      pageSize: 25
    });
  });

  it('should handle page size change from first page', () => {
    spyOn(component.pageChange, 'emit');
    component.totalItems = 100;
    component.pageSize = 10;
    component.currentPage = 1;

    const mockEvent = {
      target: { value: '50' }
    } as any;

    component.onPageSizeChange(mockEvent);

    expect(component.pageSize).toBe(50);
    expect(component.currentPage).toBe(1);
    expect(component.pageChange.emit).toHaveBeenCalledWith({
      page: 1,
      pageSize: 50
    });
  });

  it('should render first/prev buttons disabled on first page', () => {
    component.currentPage = 1;
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.nav-button');
    const firstButton = buttons[0];
    const prevButton = buttons[1];

    expect(firstButton.disabled).toBe(true);
    expect(prevButton.disabled).toBe(true);
  });

  it('should render next/last buttons disabled on last page', () => {
    component.totalItems = 100;
    component.pageSize = 10;
    component.currentPage = 10;
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.nav-button');
    const nextButton = buttons[2];
    const lastButton = buttons[3];

    expect(nextButton.disabled).toBe(true);
    expect(lastButton.disabled).toBe(true);
  });

  it('should render page info correctly', () => {
    component.totalItems = 100;
    component.pageSize = 10;
    component.currentPage = 5;
    fixture.detectChanges();

    const infoText = fixture.nativeElement.querySelector('.info-text');
    expect(infoText.textContent.trim()).toContain('41-50 of 100');
  });

  it('should render page indicator correctly', () => {
    component.totalItems = 100;
    component.pageSize = 10;
    component.currentPage = 5;
    fixture.detectChanges();

    const pageText = fixture.nativeElement.querySelector('.page-text');
    expect(pageText.textContent.trim()).toContain('Page 5 of 10');
  });

  it('should render page size options', () => {
    component.pageSizeOptions = [10, 25, 50, 100];
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('.size-select option');
    expect(options.length).toBe(4);
    expect(options[0].value).toBe('10');
    expect(options[1].value).toBe('25');
    expect(options[2].value).toBe('50');
    expect(options[3].value).toBe('100');
  });

  it('should select current page size in dropdown', () => {
    component.pageSize = 25;
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('.size-select');
    expect(select.value).toBe('25');
  });

  it('should ensure page is within valid range', () => {
    spyOn(component.pageChange, 'emit');
    component.totalItems = 50;
    component.pageSize = 10;
    component.currentPage = 1;

    // Try to go to a page beyond total pages
    component['changePage'](100);

    expect(component.currentPage).toBe(5); // Should clamp to max page
    expect(component.pageChange.emit).toHaveBeenCalledWith({
      page: 5,
      pageSize: 10
    });
  });

  it('should ensure page is at least 1', () => {
    spyOn(component.pageChange, 'emit');
    component.totalItems = 100;
    component.pageSize = 10;
    component.currentPage = 5;

    // Try to go to page 0 or negative
    component['changePage'](0);

    expect(component.currentPage).toBe(1); // Should clamp to min page
    expect(component.pageChange.emit).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10
    });
  });
});
