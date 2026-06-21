import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsvBadgeComponent } from './msv-badge.component';

describe('MsvBadgeComponent', () => {
  let component: MsvBadgeComponent;
  let fixture: ComponentFixture<MsvBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display value when less than max', () => {
    component.value = 5;
    component.max = 99;
    expect(component.displayValue).toBe('5');
  });

  it('should display max+ when value exceeds max', () => {
    component.value = 150;
    component.max = 99;
    expect(component.displayValue).toBe('99+');
  });

  it('should display exact max value when value equals max', () => {
    component.value = 99;
    component.max = 99;
    expect(component.displayValue).toBe('99');
  });

  it('should show badge when value is greater than 0', () => {
    component.value = 5;
    expect(component.shouldShowBadge).toBe(true);
  });

  it('should not show badge when value is 0', () => {
    component.value = 0;
    expect(component.shouldShowBadge).toBe(false);
  });

  it('should show badge in dot mode regardless of value', () => {
    component.dot = true;
    component.value = 0;
    expect(component.shouldShowBadge).toBe(true);
  });

  it('should return empty displayValue in dot mode', () => {
    component.dot = true;
    component.value = 10;
    expect(component.displayValue).toBe('');
  });

  it('should apply correct color class', () => {
    component.color = 'success';
    expect(component.badgeClass).toBe('badge-success');
  });

  it('should apply dot class when dot mode is enabled', () => {
    component.dot = true;
    component.color = 'error';
    expect(component.badgeClass).toBe('badge-error badge-dot');
  });

  it('should handle string value and convert to number', () => {
    component.value = '25';
    component.max = 99;
    expect(component.displayValue).toBe('25');
  });

  it('should handle string value exceeding max', () => {
    component.value = '150';
    component.max = 99;
    expect(component.displayValue).toBe('99+');
  });

  it('should handle non-numeric string values', () => {
    component.value = 'NEW';
    expect(component.displayValue).toBe('NEW');
  });

  it('should use default max value of 99', () => {
    expect(component.max).toBe(99);
  });

  it('should use default color of error', () => {
    expect(component.color).toBe('error');
  });

  it('should use default dot value of false', () => {
    expect(component.dot).toBe(false);
  });
});
