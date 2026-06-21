import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsvProgressComponent } from './msv-progress.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('MsvProgressComponent', () => {
  let component: MsvProgressComponent;
  let fixture: ComponentFixture<MsvProgressComponent>;
  let progressBarElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvProgressComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    progressBarElement = fixture.debugElement.query(By.css('.msv-progress-bar'));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render progress bar element', () => {
    expect(progressBarElement).toBeTruthy();
    expect(progressBarElement.nativeElement).toBeTruthy();
  });

  it('should default to 0 value', () => {
    expect(component.value).toBe(0);
    expect(component.clampedValue).toBe(0);
    const styles = progressBarElement.nativeElement.style;
    expect(styles.width).toBe('0%');
  });

  it('should clamp value below 0 to 0', () => {
    component.value = -10;
    expect(component.clampedValue).toBe(0);
  });

  it('should clamp value above 100 to 100', () => {
    component.value = 150;
    expect(component.clampedValue).toBe(100);
  });

  it('should accept valid values between 0-100', () => {
    component.value = 50;
    expect(component.clampedValue).toBe(50);
    
    component.value = 0;
    expect(component.clampedValue).toBe(0);
    
    component.value = 100;
    expect(component.clampedValue).toBe(100);
  });

  it('should use primary color by default', () => {
    expect(component.color).toBe('primary');
    expect(component.progressColor).toBe('var(--msv-primary-color)');
    const styles = progressBarElement.nativeElement.style;
    expect(styles.backgroundColor).toContain('var(--msv-primary-color)');
  });

  it('should support all color variants', () => {
    const colorVariants: Array<{
      color: 'primary' | 'success' | 'warning' | 'error';
      expectedVar: string;
    }> = [
      { color: 'primary', expectedVar: 'var(--msv-primary-color)' },
      { color: 'success', expectedVar: 'var(--msv-success-color)' },
      { color: 'warning', expectedVar: 'var(--msv-warning-color)' },
      { color: 'error', expectedVar: 'var(--msv-error-color)' },
    ];

    colorVariants.forEach(({ color, expectedVar }) => {
      component.color = color;
      expect(component.progressColor).toBe(expectedVar);
    });
  });

  it('should not show label by default', () => {
    expect(component.showLabel).toBe(false);
    const labelElement = fixture.debugElement.query(By.css('.msv-progress-label'));
    expect(labelElement).toBeFalsy();
  });

  it('should show label when showLabel is true', () => {
    component.showLabel = true;
    component.value = 75;
    fixture.detectChanges();
    
    const labelElement = fixture.debugElement.query(By.css('.msv-progress-label'));
    expect(labelElement).toBeTruthy();
    expect(labelElement.nativeElement.textContent).toBe('75%');
  });

  it('should not apply striped class by default', () => {
    expect(component.striped).toBe(false);
    const classes = progressBarElement.nativeElement.classList;
    expect(classes.contains('msv-progress-striped')).toBe(false);
  });

  it('should apply striped class when striped is true', () => {
    component.striped = true;
    fixture.detectChanges();
    
    const classes = progressBarElement.nativeElement.classList;
    expect(classes.contains('msv-progress-striped')).toBe(true);
  });

  it('should not apply animated class by default', () => {
    expect(component.animated).toBe(false);
    const classes = progressBarElement.nativeElement.classList;
    expect(classes.contains('msv-progress-animated')).toBe(false);
  });

  it('should apply animated class only when both striped and animated are true', () => {
    component.striped = true;
    component.animated = true;
    fixture.detectChanges();
    
    const classes = progressBarElement.nativeElement.classList;
    expect(classes.contains('msv-progress-animated')).toBe(true);
    expect(classes.contains('msv-progress-striped')).toBe(true);
  });

  it('should not apply animated class when animated is true but striped is false', () => {
    component.striped = false;
    component.animated = true;
    fixture.detectChanges();
    
    const classes = progressBarElement.nativeElement.classList;
    expect(classes.contains('msv-progress-animated')).toBe(false);
  });

  it('should update progress width when value changes', () => {
    component.value = 25;
    fixture.detectChanges();
    let styles = progressBarElement.nativeElement.style;
    expect(styles.width).toBe('25%');

    component.value = 75;
    fixture.detectChanges();
    styles = progressBarElement.nativeElement.style;
    expect(styles.width).toBe('75%');
  });

  it('should apply correct styles with all properties combined', () => {
    component.value = 60;
    component.color = 'success';
    component.showLabel = true;
    component.striped = true;
    component.animated = true;
    fixture.detectChanges();

    const styles = component.progressStyles;
    expect(styles['width']).toBe('60%');
    expect(styles['backgroundColor']).toBe('var(--msv-success-color)');

    const classes = component.progressClasses;
    expect(classes['msv-progress-bar']).toBe(true);
    expect(classes['msv-progress-striped']).toBe(true);
    expect(classes['msv-progress-animated']).toBe(true);

    const labelElement = fixture.debugElement.query(By.css('.msv-progress-label'));
    expect(labelElement).toBeTruthy();
    expect(labelElement.nativeElement.textContent).toBe('60%');
  });
});
