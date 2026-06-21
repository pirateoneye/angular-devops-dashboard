import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MsvNumberComponent } from './msv-number.component';
import { MsvValidatorHelper } from '../msv-validator.helper';
import { MSV_FORMS_CONFIG } from '../msv-forms.config';

// Test host component for errorTemplate
@Component({
  template: `
    <msv-number [validators]="['required']" [errorTemplate]="customError">
    </msv-number>
    <ng-template #customError let-errors>
      <div class="custom-error">Custom: {{ errors[0] }}</div>
    </ng-template>
  `
})
class TestErrorTemplateComponent {
  @ViewChild('customError', { static: true }) customError!: TemplateRef<any>;
}

describe('MsvNumberComponent', () => {
  let component: MsvNumberComponent;
  let fixture: ComponentFixture<MsvNumberComponent>;

  const mockConfig = {
    validationMessages: {
      required: 'Field ini wajib diisi',
      email: 'Format email tidak valid',
      minLength: (min: number) => `Minimal ${min} karakter`,
      maxLength: (max: number) => `Maksimal ${max} karakter`,
      pattern: 'Format tidak valid',
      min: (min: number) => `Nilai minimal ${min}`,
      max: (max: number) => `Nilai maksimal ${max}`
    },
    loadingText: 'Processing...'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvNumberComponent, TestErrorTemplateComponent],
      imports: [FormsModule],
      providers: [
        MsvValidatorHelper,
        { provide: MSV_FORMS_CONFIG, useValue: mockConfig }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should implement ControlValueAccessor', () => {
    expect(component.writeValue).toBeDefined();
    expect(component.registerOnChange).toBeDefined();
    expect(component.registerOnTouched).toBeDefined();
    expect(component.setDisabledState).toBeDefined();
  });

  it('should emit value changes via onChange', () => {
    const spy = jasmine.createSpy('onChange');
    component.registerOnChange(spy);

    component.onInput({ target: { value: '42' } } as any);

    expect(spy).toHaveBeenCalledWith(42);
  });

  it('should show required error when touched and empty', () => {
    component.validators = ['required'];
    component.value = null;
    component.onBlur();

    expect(component.touched).toBe(true);
    expect(component.errors).toContain('Field ini wajib diisi');
    expect(component.showError).toBe(true);
  });

  it('should disable input when disabled=true', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
  });

  it('should validate min constraint', () => {
    component.min = 10;
    component.ngOnInit(); // Re-initialize to add min validator
    component.value = 5;
    component.onBlur();

    expect(component.errors).toContain('Nilai minimal 10');
  });

  it('should validate max constraint', () => {
    component.max = 100;
    component.ngOnInit(); // Re-initialize to add max validator
    component.value = 150;
    component.onBlur();

    expect(component.errors).toContain('Nilai maksimal 100');
  });

  it('should increment value by step', () => {
    component.step = 5;
    component.value = 10;
    component.increment();

    expect(component.value).toBe(15);
  });

  it('should decrement value by step', () => {
    component.step = 5;
    component.value = 20;
    component.decrement();

    expect(component.value).toBe(15);
  });

  it('should not increment beyond max', () => {
    component.max = 100;
    component.value = 98;
    component.step = 5;
    component.increment();

    expect(component.value).toBe(100);
  });

  it('should not decrement below min', () => {
    component.min = 0;
    component.value = 2;
    component.step = 5;
    component.decrement();

    expect(component.value).toBe(0);
  });

  it('should prevent non-numeric input', () => {
    component.displayValue = '123';
    component.onInput({ target: { value: '123abc' } } as any);

    // Should revert to previous value
    expect(component.displayValue).toBe('123');
  });

  it('should allow negative numbers', () => {
    const spy = jasmine.createSpy('onChange');
    component.registerOnChange(spy);

    component.onInput({ target: { value: '-42' } } as any);

    expect(component.value).toBe(-42);
    expect(spy).toHaveBeenCalledWith(-42);
  });

  it('should allow decimal numbers', () => {
    const spy = jasmine.createSpy('onChange');
    component.registerOnChange(spy);

    component.onInput({ target: { value: '3.14' } } as any);

    expect(component.value).toBe(3.14);
    expect(spy).toHaveBeenCalledWith(3.14);
  });

  it('should set atMin to true when value equals min', () => {
    component.min = 10;
    component.value = 10;

    expect(component.atMin).toBe(true);
  });

  it('should set atMax to true when value equals max', () => {
    component.max = 100;
    component.value = 100;

    expect(component.atMax).toBe(true);
  });

  it('should disable decrement button when at min', () => {
    component.min = 0;
    component.value = 0;
    component.showButtons = true;
    fixture.detectChanges();

    const decrementBtn = fixture.nativeElement.querySelector('.decrement');
    expect(decrementBtn.disabled).toBe(true);
  });

  it('should disable increment button when at max', () => {
    component.max = 100;
    component.value = 100;
    component.showButtons = true;
    fixture.detectChanges();

    const incrementBtn = fixture.nativeElement.querySelector('.increment');
    expect(incrementBtn.disabled).toBe(true);
  });

  it('should not show buttons when showButtons is false', () => {
    component.showButtons = false;
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.msv-number-btn');
    expect(buttons.length).toBe(0);
  });

  it('should use custom errorTemplate when provided', () => {
    const hostFixture = TestBed.createComponent(TestErrorTemplateComponent);
    hostFixture.detectChanges();

    const numberComponent = hostFixture.debugElement.children[0].componentInstance;
    numberComponent.value = null;
    numberComponent.onBlur();
    hostFixture.detectChanges();

    const compiled = hostFixture.nativeElement;
    const customError = compiled.querySelector('.custom-error');
    expect(customError).toBeTruthy();
    expect(customError.textContent).toContain('Custom: Field ini wajib diisi');
  });

  it('should use default error display when errorTemplate is null', () => {
    component.validators = ['required'];
    component.errorTemplate = null;
    component.value = null;
    component.onBlur();
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const defaultError = compiled.querySelector('.msv-number-error');
    expect(defaultError).toBeTruthy();
    expect(defaultError.textContent).toBe('Field ini wajib diisi');
  });

  describe('Service Integration', () => {
    it('should inject MsvValidatorHelper service', () => {
      expect(component['validatorHelper']).toBeTruthy();
      expect(component['validatorHelper'] instanceof MsvValidatorHelper).toBe(true);
    });

    it('should inject MSV_FORMS_CONFIG', () => {
      expect(component['config']).toBeTruthy();
      expect(component['config'].validationMessages).toBeDefined();
    });

    it('should use validatorHelper.runValidation for validation', () => {
      const validatorHelper = component['validatorHelper'];
      spyOn(validatorHelper, 'runValidation').and.returnValue(['Test error']);

      component.validators = ['required'];
      component.value = null;
      component.onBlur();

      expect(validatorHelper.runValidation).toHaveBeenCalledWith(null, ['required'], component['config']);
      expect(component.errors).toEqual(['Test error']);
    });
  });
});
