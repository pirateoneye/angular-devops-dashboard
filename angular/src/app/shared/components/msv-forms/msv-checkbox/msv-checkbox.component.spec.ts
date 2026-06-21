import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MsvCheckboxComponent } from './msv-checkbox.component';
import { MsvValidatorHelper } from '../msv-validator.helper';
import { MSV_FORMS_CONFIG } from '../msv-forms.config';

// Test host component for errorTemplate
@Component({
  template: `
    <msv-checkbox [validators]="['required']" [errorTemplate]="customError">
    </msv-checkbox>
    <ng-template #customError let-errors>
      <div class="custom-error">Custom: {{ errors[0] }}</div>
    </ng-template>
  `
})
class TestErrorTemplateComponent {
  @ViewChild('customError', { static: true }) customError!: TemplateRef<any>;
}

describe('MsvCheckboxComponent', () => {
  let component: MsvCheckboxComponent;
  let fixture: ComponentFixture<MsvCheckboxComponent>;

  const mockConfig = {
    validationMessages: {
      required: 'Field ini wajib diisi',
      email: 'Format email tidak valid',
      minLength: (min: number) => `Minimal ${min} karakter`,
      maxLength: (max: number) => `Maksimal ${max} karakter`,
      pattern: 'Format tidak valid'
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvCheckboxComponent, TestErrorTemplateComponent],
      imports: [FormsModule],
      providers: [
        MsvValidatorHelper,
        { provide: MSV_FORMS_CONFIG, useValue: mockConfig }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvCheckboxComponent);
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

  it('should implement Validator interface', () => {
    expect(component.validate).toBeDefined();
  });

  it('should start with false value', () => {
    expect(component.value).toBe(false);
  });

  it('should update value when writeValue is called', () => {
    component.writeValue(true);
    expect(component.value).toBe(true);

    component.writeValue(false);
    expect(component.value).toBe(false);
  });

  it('should emit value changes via onChange', () => {
    const spy = jasmine.createSpy('onChange');
    component.registerOnChange(spy);

    component.onCheckboxChange({ target: { checked: true } } as any);

    expect(spy).toHaveBeenCalledWith(true);
    expect(component.value).toBe(true);
  });

  it('should mark as touched when onBlur is called', () => {
    expect(component.touched).toBe(false);
    
    component.onBlur();
    
    expect(component.touched).toBe(true);
  });

  it('should call onTouched when blurred', () => {
    const spy = jasmine.createSpy('onTouched');
    component.registerOnTouched(spy);

    component.onBlur();

    expect(spy).toHaveBeenCalled();
  });

  it('should disable checkbox when setDisabledState is called', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);

    component.setDisabledState(false);
    expect(component.disabled).toBe(false);
  });

  it('should show required error when touched and unchecked', () => {
    component.validators = ['required'];
    component.value = false;
    component.onBlur();

    expect(component.touched).toBe(true);
    expect(component.errors).toContain('Field ini wajib diisi');
    expect(component.showError).toBe(true);
  });

  it('should not show error when valid', () => {
    component.validators = ['required'];
    component.value = true;
    component.onBlur();

    expect(component.errors.length).toBe(0);
    expect(component.showError).toBe(false);
  });

  it('should validate on checkbox change', () => {
    component.validators = ['required'];
    component.value = false;
    component.onBlur();

    expect(component.errors.length).toBeGreaterThan(0);

    // Change to checked
    component.onCheckboxChange({ target: { checked: true } } as any);

    expect(component.errors.length).toBe(0);
  });

  it('should return ValidationErrors from validate() when errors exist', () => {
    component.validators = ['required'];
    component.value = false;
    
    const result = component.validate({} as any);
    
    expect(result).toEqual({ msvError: 'Field ini wajib diisi' });
  });

  it('should return null from validate() when no errors', () => {
    component.validators = ['required'];
    component.value = true;
    
    const result = component.validate({} as any);
    
    expect(result).toBeNull();
  });

  it('should display label when provided', () => {
    component.label = 'Accept Terms';
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const labelElement = compiled.querySelector('.checkbox-label');
    expect(labelElement).toBeTruthy();
    expect(labelElement.textContent).toBe('Accept Terms');
  });

  it('should not display label when not provided', () => {
    component.label = '';
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const labelElement = compiled.querySelector('.checkbox-label');
    expect(labelElement).toBeFalsy();
  });

  describe('Error Template', () => {
    it('should use custom errorTemplate when provided', () => {
      const hostFixture = TestBed.createComponent(TestErrorTemplateComponent);
      hostFixture.detectChanges();

      const checkboxComponent = hostFixture.debugElement.children[0].componentInstance;
      checkboxComponent.value = false;
      checkboxComponent.onBlur();
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement;
      const customError = compiled.querySelector('.custom-error');
      expect(customError).toBeTruthy();
      expect(customError.textContent).toContain('Custom: Field ini wajib diisi');
    });

    it('should use default error display when errorTemplate is null', () => {
      component.validators = ['required'];
      component.errorTemplate = null;
      component.value = false;
      component.onBlur();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const defaultError = compiled.querySelector('.msv-checkbox-error');
      expect(defaultError).toBeTruthy();
      expect(defaultError.textContent).toBe('Field ini wajib diisi');
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

    it('should use custom validation logic for boolean values', () => {
      component.validators = ['required'];
      component.value = false;
      component.onBlur();

      expect(component.errors).toEqual(['Field ini wajib diisi']);
      
      component.value = true;
      component.onBlur();
      
      expect(component.errors).toEqual([]);
    });
  });

  describe('Custom Validator Support', () => {
    it('should support custom validator functions', () => {
      const customValidator = {
        type: 'custom' as const,
        fn: (value: boolean) => value === true ? null : 'Must be checked'
      };

      component.validators = [customValidator];
      component.value = false;
      component.onBlur();

      expect(component.errors).toContain('Must be checked');
    });

    it('should support object-based validators with custom messages', () => {
      const customValidator = {
        type: 'required' as const,
        message: 'You must accept the terms'
      };

      component.validators = [customValidator];
      component.value = false;
      component.onBlur();

      expect(component.errors).toContain('You must accept the terms');
    });
  });
});
