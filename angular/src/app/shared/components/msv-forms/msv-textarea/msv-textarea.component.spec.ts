import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { MsvTextareaComponent } from './msv-textarea.component';
import { MsvValidatorHelper } from '../msv-validator.helper';
import { MSV_FORMS_CONFIG } from '../msv-forms.config';

// Test host component for errorTemplate
@Component({
  template: `
    <msv-textarea [validators]="['required']" [errorTemplate]="customError">
    </msv-textarea>
    <ng-template #customError let-errors>
      <div class="custom-error">Custom: {{ errors[0] }}</div>
    </ng-template>
  `,
})
class TestErrorTemplateComponent {
  @ViewChild('customError', { static: true }) customError!: TemplateRef<any>;
}

describe('MsvTextareaComponent', () => {
  let component: MsvTextareaComponent;
  let fixture: ComponentFixture<MsvTextareaComponent>;

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
      declarations: [TestErrorTemplateComponent],
      imports: [FormsModule, MsvTextareaComponent],
      providers: [
        MsvValidatorHelper,
        { provide: MSV_FORMS_CONFIG, useValue: mockConfig },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvTextareaComponent);
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

  it('should have default rows of 5', () => {
    expect(component.rows).toBe(5);
  });

  it('should show minLength error', () => {
    component.validators = ['minLength:10'];
    component.value = 'short';
    component.onBlur();

    expect(component.errors).toContain('Minimal 10 karakter');
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

  it('should disable textarea when disabled=true', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
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

  it('should emit value changes via onChange', () => {
    const spy = jasmine.createSpy('onChange');
    component.registerOnChange(spy);

    component.onInput({ target: { value: 'test content' } } as any);

    expect(spy).toHaveBeenCalledWith('test content');
  });

  describe('Error Template', () => {
    it('should use custom errorTemplate when provided', () => {
      const hostFixture = TestBed.createComponent(TestErrorTemplateComponent);
      hostFixture.detectChanges();

      const textareaComponent =
        hostFixture.debugElement.children[0].componentInstance;
      textareaComponent.value = '';
      textareaComponent.onBlur();
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
      const defaultError = compiled.querySelector('.msv-textarea-error');
      expect(defaultError).toBeTruthy();
      expect(defaultError.textContent).toBe('Field ini wajib diisi');
    });

    it('should pass errors array to errorTemplate context', () => {
      const hostFixture = TestBed.createComponent(TestErrorTemplateComponent);
      hostFixture.detectChanges();

      const textareaComponent =
        hostFixture.debugElement.children[0].componentInstance;
      textareaComponent.validators = ['required'];
      textareaComponent.value = '';
      textareaComponent.onBlur();
      hostFixture.detectChanges();

      expect(textareaComponent.errors.length).toBeGreaterThan(0);
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
