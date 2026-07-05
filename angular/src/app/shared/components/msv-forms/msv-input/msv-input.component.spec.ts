import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MsvInputComponent } from './msv-input.component';
import { MsvValidatorHelper } from '../msv-validator.helper';
import { MSV_FORMS_CONFIG } from '../msv-forms.config';

// Test host component for content projection
@Component({
  template: `
    <msv-input [validators]="['required']">
      <span msvPrefix class="prefix-icon">&#64;</span>
      <span msvSuffix class="suffix-icon">✓</span>
    </msv-input>
  `,
})
class TestHostComponent {}

// Test host component for errorTemplate
@Component({
  template: `
    <msv-input [validators]="['required']" [errorTemplate]="customError">
    </msv-input>
    <ng-template #customError let-errors>
      <div class="custom-error">Custom: {{ errors[0] }}</div>
    </ng-template>
  `,
})
class TestErrorTemplateComponent {
  @ViewChild('customError', { static: true }) customError!: TemplateRef<any>;
}

describe('MsvInputComponent', () => {
  let component: MsvInputComponent;
  let fixture: ComponentFixture<MsvInputComponent>;

  const mockConfig = {
    validationMessages: {
      required: 'Field ini wajib diisi',
      email: 'Format email tidak valid',
      minLength: (min: number) => `Minimal ${min} karakter`,
      maxLength: (max: number) => `Maksimal ${max} karakter`,
      pattern: 'Format tidak valid',
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        MsvInputComponent,
        TestHostComponent,
        TestErrorTemplateComponent,
      ],
      imports: [FormsModule],
      providers: [
        MsvValidatorHelper,
        { provide: MSV_FORMS_CONFIG, useValue: mockConfig },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvInputComponent);
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

    component.onInput({ target: { value: 'test' } } as any);

    expect(spy).toHaveBeenCalledWith('test');
  });

  it('should show required error when touched and empty', () => {
    component.validators = ['required'];
    component.value = '';
    component.onBlur();

    expect(component.touched).toBe(true);
    expect(component.errors).toContain('Field ini wajib diisi');
    expect(component.showError).toBe(true);
  });

  it('should show email error for invalid email', () => {
    component.validators = ['email'];
    component.value = 'invalid-email';
    component.onBlur();

    expect(component.errors).toContain('Format email tidak valid');
  });

  it('should disable input when disabled=true', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
  });

  it('should validate minLength constraint', () => {
    component.validators = ['minLength:5'];
    component.value = 'abc';
    component.onBlur();

    expect(component.errors).toContain('Minimal 5 karakter');
  });

  it('should validate maxLength constraint', () => {
    component.validators = ['maxLength:10'];
    component.value = 'this is a very long text';
    component.onBlur();

    expect(component.errors).toContain('Maksimal 10 karakter');
  });

  it('should validate pattern constraint', () => {
    component.validators = ['pattern:^[0-9]+$'];
    component.value = 'abc123';
    component.onBlur();

    expect(component.errors).toContain('Format tidak valid');
  });

  it('should pass pattern validation for valid input', () => {
    component.validators = ['pattern:^[0-9]+$'];
    component.value = '12345';
    component.onBlur();

    expect(component.errors).not.toContain('Format tidak valid');
  });

  describe('Content Projection', () => {
    it('should project prefix content', () => {
      const hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement;
      const prefixElement = compiled.querySelector('.prefix-icon');
      expect(prefixElement).toBeTruthy();
      expect(prefixElement.textContent).toBe('@');
    });

    it('should project suffix content', () => {
      const hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement;
      const suffixElement = compiled.querySelector('.suffix-icon');
      expect(suffixElement).toBeTruthy();
      expect(suffixElement.textContent).toBe('✓');
    });

    it('should have input-wrapper div containing prefix, input, and suffix', () => {
      const hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement;
      const wrapper = compiled.querySelector('.input-wrapper');
      expect(wrapper).toBeTruthy();

      const input = wrapper.querySelector('input');
      expect(input).toBeTruthy();
    });
  });

  describe('Error Template', () => {
    it('should use custom errorTemplate when provided', () => {
      const hostFixture = TestBed.createComponent(TestErrorTemplateComponent);
      hostFixture.detectChanges();

      const inputComponent =
        hostFixture.debugElement.children[0].componentInstance;
      inputComponent.value = '';
      inputComponent.onBlur();
      hostFixture.detectChanges();

      const compiled = hostFixture.nativeElement;
      const customError = compiled.querySelector('.custom-error');
      expect(customError).toBeTruthy();
      expect(customError.textContent).toContain(
        'Custom: Field ini wajib diisi',
      );
    });

    it('should use default error display when errorTemplate is null', () => {
      component.validators = ['required'];
      component.errorTemplate = null;
      component.value = '';
      component.onBlur();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const defaultError = compiled.querySelector('.msv-input-error');
      expect(defaultError).toBeTruthy();
      expect(defaultError.textContent).toBe('Field ini wajib diisi');
    });

    it('should pass errors array to errorTemplate context', () => {
      const hostFixture = TestBed.createComponent(TestErrorTemplateComponent);
      hostFixture.detectChanges();

      const inputComponent =
        hostFixture.debugElement.children[0].componentInstance;
      inputComponent.validators = ['required'];
      inputComponent.value = '';
      inputComponent.onBlur();
      hostFixture.detectChanges();

      expect(inputComponent.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Service Integration', () => {
    it('should inject MsvValidatorHelper service', () => {
      expect(component['validatorHelper']).toBeTruthy();
      expect(component['validatorHelper'] instanceof MsvValidatorHelper).toBe(
        true,
      );
    });

    it('should inject MSV_FORMS_CONFIG', () => {
      expect(component['config']).toBeTruthy();
      expect(component['config'].validationMessages).toBeDefined();
    });

    it('should use validatorHelper.runValidation for validation', () => {
      const validatorHelper = component['validatorHelper'];
      spyOn(validatorHelper, 'runValidation').and.returnValue(['Test error']);

      component.validators = ['required'];
      component.value = '';
      component.onBlur();

      expect(validatorHelper.runValidation).toHaveBeenCalledWith(
        '',
        ['required'],
        component['config'],
      );
      expect(component.errors).toEqual(['Test error']);
    });
  });
});
