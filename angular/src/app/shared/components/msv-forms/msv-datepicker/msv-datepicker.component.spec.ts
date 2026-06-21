import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MsvDatepickerComponent } from './msv-datepicker.component';
import { MsvValidatorHelper } from '../msv-validator.helper';
import { MSV_FORMS_CONFIG } from '../msv-forms.config';

// Test host component for errorTemplate
@Component({
  template: `
    <msv-datepicker [validators]="['required']" [errorTemplate]="customError">
    </msv-datepicker>
    <ng-template #customError let-errors>
      <div class="custom-error">Custom: {{ errors[0] }}</div>
    </ng-template>
  `
})
class TestErrorTemplateComponent {
  @ViewChild('customError', { static: true }) customError!: TemplateRef<any>;
}

describe('MsvDatepickerComponent', () => {
  let component: MsvDatepickerComponent;
  let fixture: ComponentFixture<MsvDatepickerComponent>;

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
      declarations: [MsvDatepickerComponent, TestErrorTemplateComponent],
      imports: [
        FormsModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatInputModule,
        BrowserAnimationsModule
      ],
      providers: [
        MsvValidatorHelper,
        { provide: MSV_FORMS_CONFIG, useValue: mockConfig }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvDatepickerComponent);
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

    const testDate = new Date(2024, 0, 1);
    component.onDateChange({ value: testDate });

    expect(spy).toHaveBeenCalledWith(testDate);
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

  it('should accept Date value through writeValue', () => {
    const testDate = new Date(2024, 0, 1);
    component.writeValue(testDate);
    expect(component.value).toEqual(testDate);
  });

  it('should set value to null when writeValue receives null', () => {
    component.writeValue(null);
    expect(component.value).toBeNull();
  });

  it('should validate minDate constraint', () => {
    const minDate = new Date(2024, 0, 1);
    const testDate = new Date(2023, 11, 31);
    
    component.minDate = minDate;
    component.validators = [
      {
        type: 'custom',
        fn: (val: Date | null) => {
          if (val && component.minDate && val < component.minDate) {
            return 'Date must be after minimum date';
          }
          return null;
        }
      }
    ];
    component.value = testDate;
    component.onBlur();

    expect(component.errors).toContain('Date must be after minimum date');
  });

  it('should validate maxDate constraint', () => {
    const maxDate = new Date(2024, 0, 1);
    const testDate = new Date(2024, 0, 2);
    
    component.maxDate = maxDate;
    component.validators = [
      {
        type: 'custom',
        fn: (val: Date | null) => {
          if (val && component.maxDate && val > component.maxDate) {
            return 'Date must be before maximum date';
          }
          return null;
        }
      }
    ];
    component.value = testDate;
    component.onBlur();

    expect(component.errors).toContain('Date must be before maximum date');
  });

  it('should pass validation for valid date within constraints', () => {
    const minDate = new Date(2024, 0, 1);
    const maxDate = new Date(2024, 11, 31);
    const testDate = new Date(2024, 5, 15);
    
    component.minDate = minDate;
    component.maxDate = maxDate;
    component.validators = [];
    component.value = testDate;
    component.onBlur();

    expect(component.errors.length).toBe(0);
    expect(component.showError).toBe(false);
  });

  it('should update value when date changes', () => {
    const testDate = new Date(2024, 5, 15);
    component.onDateChange({ value: testDate });

    expect(component.value).toEqual(testDate);
  });

  it('should call onTouched when blur event occurs', () => {
    const spy = jasmine.createSpy('onTouched');
    component.registerOnTouched(spy);

    component.onBlur();

    expect(spy).toHaveBeenCalled();
    expect(component.touched).toBe(true);
  });

  describe('Error Template', () => {
    it('should use custom errorTemplate when provided', () => {
      const hostFixture = TestBed.createComponent(TestErrorTemplateComponent);
      hostFixture.detectChanges();

      const datepickerComponent = hostFixture.debugElement.children[0].componentInstance;
      datepickerComponent.value = null;
      datepickerComponent.onBlur();
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
      const defaultError = compiled.querySelector('.msv-datepicker-error');
      expect(defaultError).toBeTruthy();
      expect(defaultError.textContent).toBe('Field ini wajib diisi');
    });

    it('should pass errors array to errorTemplate context', () => {
      const hostFixture = TestBed.createComponent(TestErrorTemplateComponent);
      hostFixture.detectChanges();

      const datepickerComponent = hostFixture.debugElement.children[0].componentInstance;
      datepickerComponent.validators = ['required'];
      datepickerComponent.value = null;
      datepickerComponent.onBlur();
      hostFixture.detectChanges();

      expect(datepickerComponent.errors.length).toBeGreaterThan(0);
    });
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

  describe('Validator Interface', () => {
    it('should return validation errors through validate method', () => {
      component.validators = ['required'];
      component.value = null;

      const mockControl = { value: null } as any;
      const result = component.validate(mockControl);

      expect(result).toEqual({ msvError: 'Field ini wajib diisi' });
    });

    it('should return null when validation passes', () => {
      component.validators = [];
      component.value = new Date(2024, 5, 15);

      const mockControl = { value: new Date(2024, 5, 15) } as any;
      const result = component.validate(mockControl);

      expect(result).toBeNull();
    });
  });
});
