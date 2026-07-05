import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsvBreadcrumbComponent } from './msv-breadcrumb.component';
import { provideRouter } from '@angular/router';

describe('MsvBreadcrumbComponent', () => {
  let component: MsvBreadcrumbComponent;
  let fixture: ComponentFixture<MsvBreadcrumbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MsvBreadcrumbComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvBreadcrumbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render breadcrumb items', () => {
    component.items = [
      { label: 'Home', route: '/home' },
      { label: 'Products', route: '/products' },
      { label: 'Details' },
    ];
    fixture.detectChanges();

    const breadcrumbItems =
      fixture.nativeElement.querySelectorAll('.breadcrumb-item');
    expect(breadcrumbItems.length).toBe(3);
  });

  it('should render links for items with routes (not last item)', () => {
    component.items = [
      { label: 'Home', route: '/home' },
      { label: 'Products', route: '/products' },
      { label: 'Details' },
    ];
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('.breadcrumb-link');
    expect(links.length).toBe(2);
    expect(links[0].textContent.trim()).toBe('Home');
    expect(links[1].textContent.trim()).toBe('Products');
  });

  it('should render last item as plain text with breadcrumb-current class', () => {
    component.items = [{ label: 'Home', route: '/home' }, { label: 'Details' }];
    fixture.detectChanges();

    const currentItem = fixture.nativeElement.querySelector(
      '.breadcrumb-current',
    );
    expect(currentItem).toBeTruthy();
    expect(currentItem.textContent.trim()).toBe('Details');
  });

  it('should use default separator "/"', () => {
    component.items = [
      { label: 'Home', route: '/home' },
      { label: 'Products' },
    ];
    fixture.detectChanges();

    const separator = fixture.nativeElement.querySelector(
      '.breadcrumb-separator',
    );
    expect(separator).toBeTruthy();
    expect(separator.textContent.trim()).toBe('/');
  });

  it('should use custom separator when provided', () => {
    component.items = [
      { label: 'Home', route: '/home' },
      { label: 'Products' },
    ];
    component.separator = '>';
    fixture.detectChanges();

    const separator = fixture.nativeElement.querySelector(
      '.breadcrumb-separator',
    );
    expect(separator).toBeTruthy();
    expect(separator.textContent.trim()).toBe('>');
  });

  it('should not render separator after last item', () => {
    component.items = [
      { label: 'Home', route: '/home' },
      { label: 'Products', route: '/products' },
      { label: 'Details' },
    ];
    fixture.detectChanges();

    const separators = fixture.nativeElement.querySelectorAll(
      '.breadcrumb-separator',
    );
    expect(separators.length).toBe(2); // Only 2 separators for 3 items
  });

  it('should apply routerLink directive to items with routes', () => {
    component.items = [
      { label: 'Home', route: '/home' },
      { label: 'Products', route: '/products' },
      { label: 'Details' },
    ];
    fixture.detectChanges();

    const linkElements =
      fixture.nativeElement.querySelectorAll('.breadcrumb-link');
    expect(linkElements.length).toBe(2);
    expect(linkElements[0].getAttribute('ng-reflect-router-link')).toBe(
      '/home',
    );
    expect(linkElements[1].getAttribute('ng-reflect-router-link')).toBe(
      '/products',
    );
  });

  it('should identify last item correctly', () => {
    component.items = [
      { label: 'Home', route: '/home' },
      { label: 'Products', route: '/products' },
      { label: 'Details' },
    ];

    expect(component.isLastItem(0)).toBe(false);
    expect(component.isLastItem(1)).toBe(false);
    expect(component.isLastItem(2)).toBe(true);
  });

  it('should handle single item without separator', () => {
    component.items = [{ label: 'Home' }];
    fixture.detectChanges();

    const breadcrumbItems =
      fixture.nativeElement.querySelectorAll('.breadcrumb-item');
    const separators = fixture.nativeElement.querySelectorAll(
      '.breadcrumb-separator',
    );

    expect(breadcrumbItems.length).toBe(1);
    expect(separators.length).toBe(0);
  });

  it('should render items without routes as plain text (not last item)', () => {
    component.items = [{ label: 'Home' }, { label: 'Products' }];
    fixture.detectChanges();

    const textElements =
      fixture.nativeElement.querySelectorAll('.breadcrumb-text');
    expect(textElements.length).toBe(1);
    expect(textElements[0].textContent.trim()).toBe('Home');
  });

  it('should apply breadcrumb-item-active class to last item', () => {
    component.items = [{ label: 'Home', route: '/home' }, { label: 'Details' }];
    fixture.detectChanges();

    const breadcrumbItems =
      fixture.nativeElement.querySelectorAll('.breadcrumb-item');
    expect(
      breadcrumbItems[0].classList.contains('breadcrumb-item-active'),
    ).toBe(false);
    expect(
      breadcrumbItems[1].classList.contains('breadcrumb-item-active'),
    ).toBe(true);
  });
});
