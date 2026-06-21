import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsvSpinnerComponent } from './msv-spinner.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('MsvSpinnerComponent', () => {
  let component: MsvSpinnerComponent;
  let fixture: ComponentFixture<MsvSpinnerComponent>;
  let spinnerElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvSpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    spinnerElement = fixture.debugElement.query(By.css('.msv-spinner'));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render spinner element', () => {
    expect(spinnerElement).toBeTruthy();
    expect(spinnerElement.nativeElement).toBeTruthy();
  });

  it('should default to medium size (32px)', () => {
    expect(component.size).toBe('medium');
    expect(component.spinnerSize).toBe(32);
    const styles = spinnerElement.nativeElement.style;
    expect(styles.width).toBe('32px');
    expect(styles.height).toBe('32px');
  });

  it('should set small size (16px)', () => {
    component.size = 'small';
    fixture.detectChanges();
    expect(component.spinnerSize).toBe(16);
    const styles = spinnerElement.nativeElement.style;
    expect(styles.width).toBe('16px');
    expect(styles.height).toBe('16px');
  });

  it('should set large size (48px)', () => {
    component.size = 'large';
    fixture.detectChanges();
    expect(component.spinnerSize).toBe(48);
    const styles = spinnerElement.nativeElement.style;
    expect(styles.width).toBe('48px');
    expect(styles.height).toBe('48px');
  });

  it('should use primary color by default', () => {
    expect(component.spinnerColor).toBe('var(--msv-primary-color)');
    const styles = spinnerElement.nativeElement.style;
    expect(styles.borderColor).toContain('var(--msv-primary-color)');
  });

  it('should accept custom color', () => {
    const customColor = '#ff0000';
    component.color = customColor;
    fixture.detectChanges();
    expect(component.spinnerColor).toBe(customColor);
    const styles = spinnerElement.nativeElement.style;
    // Browser converts hex to rgb, so check for the presence of color
    expect(styles.borderColor).toBeTruthy();
    expect(styles.borderColor).toContain('transparent');
  });

  it('should apply spinner styles correctly', () => {
    component.size = 'large';
    component.color = '#00ff00';
    fixture.detectChanges();
    
    const styles = component.spinnerStyles;
    expect(styles['width']).toBe('48px');
    expect(styles['height']).toBe('48px');
    expect(styles['borderColor']).toBe('#00ff00 transparent transparent transparent');
  });

  it('should handle all size variants', () => {
    const sizes: Array<{ size: 'small' | 'medium' | 'large'; expectedPx: number }> = [
      { size: 'small', expectedPx: 16 },
      { size: 'medium', expectedPx: 32 },
      { size: 'large', expectedPx: 48 },
    ];

    sizes.forEach(({ size, expectedPx }) => {
      component.size = size;
      expect(component.spinnerSize).toBe(expectedPx);
    });
  });

  it('should have CSS animation class applied', () => {
    const element = spinnerElement.nativeElement;
    expect(element.classList.contains('msv-spinner')).toBe(true);
  });
});
