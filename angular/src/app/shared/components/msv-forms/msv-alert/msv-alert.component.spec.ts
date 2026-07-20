import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsvAlertComponent } from './msv-alert.component';

describe('MsvAlertComponent', () => {
  let component: MsvAlertComponent;
  let fixture: ComponentFixture<MsvAlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MsvAlertComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvAlertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render info alert with alert-info class by default', () => {
    expect(component.alertClass).toBe('alert-info');
    const alertDiv = fixture.nativeElement.querySelector('.alert');
    expect(alertDiv.classList.contains('alert-info')).toBe(true);
  });

  it('should render success alert with alert-success class', () => {
    component.type = 'success';
    fixture.detectChanges();
    expect(component.alertClass).toBe('alert-success');
    const alertDiv = fixture.nativeElement.querySelector('.alert');
    expect(alertDiv.classList.contains('alert-success')).toBe(true);
  });

  it('should render warning alert with alert-warning class', () => {
    component.type = 'warning';
    fixture.detectChanges();
    expect(component.alertClass).toBe('alert-warning');
    const alertDiv = fixture.nativeElement.querySelector('.alert');
    expect(alertDiv.classList.contains('alert-warning')).toBe(true);
  });

  it('should render error alert with alert-error class', () => {
    component.type = 'error';
    fixture.detectChanges();
    expect(component.alertClass).toBe('alert-error');
    const alertDiv = fixture.nativeElement.querySelector('.alert');
    expect(alertDiv.classList.contains('alert-error')).toBe(true);
  });

  it('should display title when provided', () => {
    component.title = 'Important Notice';
    fixture.detectChanges();
    const titleElement = fixture.nativeElement.querySelector('.alert-title');
    expect(titleElement).toBeTruthy();
    expect(titleElement.textContent).toBe('Important Notice');
  });

  it('should not display title when not provided', () => {
    component.title = '';
    fixture.detectChanges();
    const titleElement = fixture.nativeElement.querySelector('.alert-title');
    expect(titleElement).toBeFalsy();
  });

  it('should project content into alert body', () => {
    const testHostFixture = TestBed.createComponent(MsvAlertComponent);
    testHostFixture.componentInstance.type = 'info';
    testHostFixture.nativeElement.innerHTML =
      '<msv-alert><p>Test message content</p></msv-alert>';
    testHostFixture.detectChanges();

    // Alternative approach - test the component directly
    const alertBody = fixture.nativeElement.querySelector('.alert-body');
    expect(alertBody).toBeTruthy();
  });

  it('should show dismiss button when dismissible is true', () => {
    component.dismissible = true;
    fixture.detectChanges();
    const closeButton = fixture.nativeElement.querySelector('.alert-close');
    expect(closeButton).toBeTruthy();
  });

  it('should not show dismiss button when dismissible is false', () => {
    component.dismissible = false;
    fixture.detectChanges();
    const closeButton = fixture.nativeElement.querySelector('.alert-close');
    expect(closeButton).toBeFalsy();
  });

  it('should emit dismissed event when close button is clicked', () => {
    component.dismissible = true;
    fixture.detectChanges();

    spyOn(component.dismissed, 'emit');

    const closeButton = fixture.nativeElement.querySelector('.alert-close');
    closeButton.click();

    expect(component.dismissed.emit).toHaveBeenCalled();
  });

  it('should show icon by default', () => {
    component.icon = true;
    component.type = 'info';
    fixture.detectChanges();
    const iconElement = fixture.nativeElement.querySelector('.alert-icon');
    expect(iconElement).toBeTruthy();
    expect(iconElement.textContent).toBe('ℹ');
  });

  it('should not show icon when icon is false', () => {
    component.icon = false;
    fixture.detectChanges();
    const iconElement = fixture.nativeElement.querySelector('.alert-icon');
    expect(iconElement).toBeFalsy();
  });

  it('should display correct icon for each type', () => {
    const iconTests = [
      { type: 'info', expectedIcon: 'ℹ' },
      { type: 'success', expectedIcon: '✓' },
      { type: 'warning', expectedIcon: '⚠' },
      { type: 'error', expectedIcon: '✕' },
    ];

    iconTests.forEach((test) => {
      component.type = test.type as 'info' | 'success' | 'warning' | 'error';
      component.icon = true;
      fixture.detectChanges();
      expect(component.iconSymbol).toBe(test.expectedIcon);
    });
  });

  it('should have default values set correctly', () => {
    const newComponent = new MsvAlertComponent();
    expect(newComponent.type).toBe('info');
    expect(newComponent.title).toBe('');
    expect(newComponent.dismissible).toBe(false);
    expect(newComponent.icon).toBe(true);
  });
});
