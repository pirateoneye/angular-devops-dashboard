import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { MsvToastComponent } from './msv-toast.component';
import { Toast } from './msv-toast.service';

describe('MsvToastComponent', () => {
  let component: MsvToastComponent;
  let fixture: ComponentFixture<MsvToastComponent>;

  const createMockToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    title?: string,
  ): Toast => ({
    id: 'test-toast-1',
    type,
    message,
    title,
    duration: 5000,
    timestamp: Date.now(),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, MsvToastComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvToastComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.toast = createMockToast('info', 'Test message');
    expect(component).toBeTruthy();
  });

  describe('Toast Display', () => {
    it('should display toast message', () => {
      component.toast = createMockToast('info', 'Test message');
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const messageEl = compiled.querySelector('.toast-message');
      expect(messageEl.textContent).toContain('Test message');
    });

    it('should display toast title when provided', () => {
      component.toast = createMockToast('info', 'Test message', 'Test Title');
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const titleEl = compiled.querySelector('.toast-title');
      expect(titleEl).toBeTruthy();
      expect(titleEl.textContent).toContain('Test Title');
    });

    it('should not display title element when title is not provided', () => {
      component.toast = createMockToast('info', 'Test message');
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const titleEl = compiled.querySelector('.toast-title');
      expect(titleEl).toBeFalsy();
    });

    it('should apply correct class for info toast', () => {
      component.toast = createMockToast('info', 'Info message');
      fixture.detectChanges();

      expect(component.toastClass).toBe('toast-info');
    });

    it('should apply correct class for success toast', () => {
      component.toast = createMockToast('success', 'Success message');
      fixture.detectChanges();

      expect(component.toastClass).toBe('toast-success');
    });

    it('should apply correct class for warning toast', () => {
      component.toast = createMockToast('warning', 'Warning message');
      fixture.detectChanges();

      expect(component.toastClass).toBe('toast-warning');
    });

    it('should apply correct class for error toast', () => {
      component.toast = createMockToast('error', 'Error message');
      fixture.detectChanges();

      expect(component.toastClass).toBe('toast-error');
    });
  });

  describe('Toast Icons', () => {
    it('should display info icon', () => {
      component.toast = createMockToast('info', 'Info message');
      fixture.detectChanges();

      expect(component.iconSymbol).toBe('ℹ');
    });

    it('should display success icon', () => {
      component.toast = createMockToast('success', 'Success message');
      fixture.detectChanges();

      expect(component.iconSymbol).toBe('✓');
    });

    it('should display warning icon', () => {
      component.toast = createMockToast('warning', 'Warning message');
      fixture.detectChanges();

      expect(component.iconSymbol).toBe('⚠');
    });

    it('should display error icon', () => {
      component.toast = createMockToast('error', 'Error message');
      fixture.detectChanges();

      expect(component.iconSymbol).toBe('✕');
    });
  });

  describe('Toast Dismissal', () => {
    it('should emit dismissed event when close button clicked', fakeAsync(() => {
      component.toast = createMockToast('info', 'Test message');
      fixture.detectChanges();

      let emittedId: string | undefined;
      component.dismissed.subscribe({
        next: (id: string) => {
          emittedId = id;
        },
      });

      const closeButton = fixture.nativeElement.querySelector('.toast-close');
      closeButton.click();
      tick(300); // Wait for animation

      expect(emittedId).toBe('test-toast-1');
    }));

    it('should set visible to false on dismiss', () => {
      component.toast = createMockToast('info', 'Test message');
      fixture.detectChanges();

      component.visible = true;
      component.onDismiss();

      expect(component.visible).toBe(false);
    });
  });

  describe('Toast Animation', () => {
    it('should set visible to true after initialization', fakeAsync(() => {
      component.toast = createMockToast('info', 'Test message');
      component.ngOnInit();

      expect(component.visible).toBe(false);

      tick(10);
      expect(component.visible).toBe(true);
    }));

    it('should apply toast-visible class when visible', () => {
      component.toast = createMockToast('info', 'Test message');
      component.visible = true;
      fixture.detectChanges();

      const toastEl = fixture.nativeElement.querySelector('.toast');
      expect(toastEl.classList.contains('toast-visible')).toBe(true);
    });

    it('should not apply toast-visible class when not visible', () => {
      component.toast = createMockToast('info', 'Test message');
      component.visible = false;
      fixture.detectChanges();

      const toastEl = fixture.nativeElement.querySelector('.toast');
      expect(toastEl.classList.contains('toast-visible')).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      component.toast = createMockToast('info', 'Test message');
      fixture.detectChanges();

      const toastEl = fixture.nativeElement.querySelector('.toast');
      expect(toastEl.getAttribute('role')).toBe('alert');
    });

    it('should have aria-live="polite" for non-error toasts', () => {
      component.toast = createMockToast('info', 'Test message');
      fixture.detectChanges();

      const toastEl = fixture.nativeElement.querySelector('.toast');
      expect(toastEl.getAttribute('aria-live')).toBe('polite');
    });

    it('should have aria-live="assertive" for error toasts', () => {
      component.toast = createMockToast('error', 'Error message');
      fixture.detectChanges();

      const toastEl = fixture.nativeElement.querySelector('.toast');
      expect(toastEl.getAttribute('aria-live')).toBe('assertive');
    });

    it('should have aria-label on close button', () => {
      component.toast = createMockToast('info', 'Test message');
      fixture.detectChanges();

      const closeButton = fixture.nativeElement.querySelector('.toast-close');
      expect(closeButton.getAttribute('aria-label')).toBe('Close toast');
    });
  });
});
