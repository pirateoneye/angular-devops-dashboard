import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsvTableComponent } from './msv-table.component';
import { MSV_FORMS_CONFIG } from '../msv-forms.config';
import { SimpleChange } from '@angular/core';
import { MsvTableColumn } from './msv-table.types';

describe('MsvTableComponent', () => {
  let component: MsvTableComponent;
  let fixture: ComponentFixture<MsvTableComponent>;

  const mockConfig = {
    validationMessages: {
      required: 'Field ini wajib diisi',
      email: 'Format email tidak valid',
      minLength: (min: number) => `Minimal ${min} karakter`,
      maxLength: (max: number) => `Maksimal ${max} karakter`,
      pattern: 'Format tidak valid',
    },
    loadingText: 'Processing...',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvTableComponent],
      providers: [{ provide: MSV_FORMS_CONFIG, useValue: mockConfig }],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject config', () => {
    expect(component.config).toBeTruthy();
    expect(component.config.loadingText).toBe('Processing...');
  });

  it('should initialize with default values', () => {
    expect(component.data).toEqual([]);
    expect(component.columns).toEqual([]);
    expect(component.sortable).toBe(false);
    expect(component.paginator).toBe(false);
    expect(component.pageSize).toBe(10);
    expect(component.currentPage).toBe(1);
  });

  it('should render table with columns', () => {
    component.columns = [
      { key: 'name', header: 'Name' },
      { key: 'age', header: 'Age' },
    ];
    component.data = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
    ];
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll('th');
    expect(headers.length).toBe(2);
    expect(headers[0].textContent).toContain('Name');
    expect(headers[1].textContent).toContain('Age');
  });

  it('should render table rows with data', () => {
    component.columns = [
      { key: 'name', header: 'Name' },
      { key: 'age', header: 'Age' },
    ];
    component.data = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
    ];
    // Direct @Input assignment doesn't fire ngOnChanges in a unit test, so the
    // component's displayedData (populated by ngOnChanges -> updateDisplayedData)
    // would stay empty. Trigger it explicitly so rows render.
    component.ngOnChanges({
      data: new SimpleChange([], component.data, false),
    } as any);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('should emit rowClick event when row is clicked', () => {
    spyOn(component.rowClick, 'emit');
    component.columns = [{ key: 'name', header: 'Name' }];
    component.data = [{ name: 'John' }];
    component.ngOnChanges({
      data: new SimpleChange([], component.data, false),
    } as any);
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('tbody tr');
    row.click();

    expect(component.rowClick.emit).toHaveBeenCalledWith({ name: 'John' });
  });

  it('should apply sortable class to sortable columns', () => {
    component.sortable = true;
    component.columns = [
      { key: 'name', header: 'Name', sortable: true },
      { key: 'age', header: 'Age', sortable: false },
    ];
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll('th');
    expect(headers[0].classList.contains('sortable')).toBe(true);
    expect(headers[1].classList.contains('sortable')).toBe(false);
  });

  it('should toggle sort direction on header click', () => {
    component.sortable = true;
    component.columns = [{ key: 'name', header: 'Name', sortable: true }];
    component.data = [{ name: 'John' }, { name: 'Jane' }];
    fixture.detectChanges();

    const column = component.columns[0];

    // First click: asc
    component.onHeaderClick(column);
    expect(component.sortDirection).toBe('asc');
    expect(component.sortColumn).toBe('name');

    // Second click: desc
    component.onHeaderClick(column);
    expect(component.sortDirection).toBe('desc');
    expect(component.sortColumn).toBe('name');

    // Third click: null
    component.onHeaderClick(column);
    expect(component.sortDirection).toBeNull();
    expect(component.sortColumn).toBeNull();
  });

  it('should emit sortChange event when sorting', () => {
    spyOn(component.sortChange, 'emit');
    component.sortable = true;
    component.columns = [{ key: 'name', header: 'Name', sortable: true }];

    component.onHeaderClick(component.columns[0]);

    expect(component.sortChange.emit).toHaveBeenCalledWith({
      column: 'name',
      direction: 'asc',
    });
  });

  it('should sort data in ascending order', () => {
    component.columns = [{ key: 'name', header: 'Name', sortable: true }];
    component.data = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
    component.sortable = true;
    component.sortColumn = 'name';
    component.sortDirection = 'asc';
    component.ngOnInit();

    expect(component.displayedData[0].name).toBe('Alice');
    expect(component.displayedData[1].name).toBe('Bob');
    expect(component.displayedData[2].name).toBe('Charlie');
  });

  it('should sort data in descending order', () => {
    component.columns = [{ key: 'name', header: 'Name', sortable: true }];
    component.data = [{ name: 'Alice' }, { name: 'Charlie' }, { name: 'Bob' }];
    component.sortable = true;
    component.sortColumn = 'name';
    component.sortDirection = 'desc';
    component.ngOnInit();

    expect(component.displayedData[0].name).toBe('Charlie');
    expect(component.displayedData[1].name).toBe('Bob');
    expect(component.displayedData[2].name).toBe('Alice');
  });

  it('should sort numeric data correctly', () => {
    component.columns = [{ key: 'age', header: 'Age', sortable: true }];
    component.data = [{ age: 30 }, { age: 25 }, { age: 35 }];
    component.sortable = true;
    component.sortColumn = 'age';
    component.sortDirection = 'asc';
    component.ngOnInit();

    expect(component.displayedData[0].age).toBe(25);
    expect(component.displayedData[1].age).toBe(30);
    expect(component.displayedData[2].age).toBe(35);
  });

  it('should display sort indicator for sorted column', () => {
    component.sortable = true;
    component.columns = [{ key: 'name', header: 'Name', sortable: true }];
    component.sortColumn = 'name';
    component.sortDirection = 'asc';

    expect(component.getSortIndicator(component.columns[0])).toBe('▲');

    component.sortDirection = 'desc';
    expect(component.getSortIndicator(component.columns[0])).toBe('▼');

    component.sortDirection = null;
    expect(component.getSortIndicator(component.columns[0])).toBe('');
  });

  it('should paginate data when paginator is enabled', () => {
    component.paginator = true;
    component.pageSize = 2;
    component.data = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    component.ngOnInit();

    expect(component.paginatedData.length).toBe(2);
    expect(component.paginatedData[0].id).toBe(1);
    expect(component.paginatedData[1].id).toBe(2);
  });

  it('should calculate total pages correctly', () => {
    component.paginator = true;
    component.pageSize = 3;
    component.data = [1, 2, 3, 4, 5, 6, 7];

    expect(component.totalPages).toBe(3);
  });

  it('should handle page change event', () => {
    component.paginator = true;
    component.pageSize = 2;
    component.data = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    component.ngOnInit();

    component.onPageChange({ page: 2, pageSize: 2 });

    expect(component.currentPage).toBe(2);
    expect(component.paginatedData[0].id).toBe(3);
  });

  it('should return all data when paginator is disabled', () => {
    component.paginator = false;
    component.data = [{ id: 1 }, { id: 2 }, { id: 3 }];
    component.ngOnInit();

    expect(component.paginatedData.length).toBe(3);
  });

  it('should get cell value from row and column', () => {
    const row = { name: 'John', age: 30 };
    const column: MsvTableColumn = { key: 'name', header: 'Name' };

    expect(component.getCellValue(row, column)).toBe('John');
  });

  it('should check if column is sorted', () => {
    component.sortColumn = 'name';
    component.sortDirection = 'asc';

    const sortedColumn: MsvTableColumn = { key: 'name', header: 'Name' };
    const unsortedColumn: MsvTableColumn = { key: 'age', header: 'Age' };

    expect(component.isSorted(sortedColumn)).toBe(true);
    expect(component.isSorted(unsortedColumn)).toBe(false);
  });

  it('should not sort when column is not sortable', () => {
    component.sortable = true;
    const column: MsvTableColumn = {
      key: 'name',
      header: 'Name',
      sortable: false,
    };

    component.onHeaderClick(column);

    expect(component.sortColumn).toBeNull();
    expect(component.sortDirection).toBeNull();
  });

  it('should not sort when sortable is disabled globally', () => {
    component.sortable = false;
    const column: MsvTableColumn = {
      key: 'name',
      header: 'Name',
      sortable: true,
    };

    component.onHeaderClick(column);

    expect(component.sortColumn).toBeNull();
    expect(component.sortDirection).toBeNull();
  });

  it('should update displayed data on data changes', () => {
    component.data = [{ id: 1 }];
    component.ngOnChanges({
      data: {
        currentValue: [{ id: 1 }],
        previousValue: [],
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    expect(component.displayedData.length).toBe(1);
  });

  it('should update displayed data on pageSize changes', () => {
    component.data = [{ id: 1 }, { id: 2 }, { id: 3 }];
    component.pageSize = 2;
    component.ngOnChanges({
      pageSize: {
        currentValue: 2,
        previousValue: 10,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.displayedData.length).toBe(3);
  });

  it('should handle empty data gracefully', () => {
    component.data = [];
    component.columns = [{ key: 'name', header: 'Name' }];
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should handle null values in sorting', () => {
    component.columns = [{ key: 'name', header: 'Name', sortable: true }];
    component.data = [{ name: 'Alice' }, { name: null }, { name: 'Bob' }];
    component.sortable = true;
    component.sortColumn = 'name';
    component.sortDirection = 'asc';
    component.ngOnInit();

    // Null values should be sorted to the end in ascending order
    expect(component.displayedData[0].name).toBe('Alice');
    expect(component.displayedData[1].name).toBe('Bob');
    expect(component.displayedData[2].name).toBeNull();
  });

  it('should change page size correctly', () => {
    component.paginator = true;
    component.data = [1, 2, 3, 4, 5];
    component.pageSize = 2;
    component.ngOnInit();

    component.onPageChange({ page: 1, pageSize: 5 });

    expect(component.pageSize).toBe(5);
    expect(component.paginatedData.length).toBe(5);
  });
});
