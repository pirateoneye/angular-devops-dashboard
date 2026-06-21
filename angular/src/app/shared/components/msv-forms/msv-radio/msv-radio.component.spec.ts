import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { MsvRadioComponent } from './msv-radio.component';
import { MsvValidatorHelper } from '../msv-validator.helper';
import { MSV_FORMS_CONFIG } from '../msv-forms.config';

describe('MsvRadioComponent', () => {
  let component: MsvRadioComponent;
  let fixture: ComponentFixture<MsvRadioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvRadioComponent],
      imports: [FormsModule],
      providers: [
        MsvValidatorHelper,
        {
          provide: MSV_FORMS_CONFIG,
          useValue: {
            validationMessages: {
              required: 'Field ini wajib diisi',
              email: 'Format email tidak valid',
              minLength: (min: number) => `Minimal ${min} karakter`,
              maxLength: (max: number) => `Maksimal ${max} karakter`,
              pattern: 'Format tidak valid',
              min: (min: number) => `Nilai minimal ${min}`,
              max: (max: number) => `Nilai maksimal ${max}`,
            },
            loadingText: 'Processing...',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvRadioComponent);
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

  it('should render radio options from input', () => {
    component.options = [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
      { label: 'Option 3', value: 'opt3' },
    ];
    fixture.detectChanges();

    const radioInputs = fixture.nativeElement.querySelectorAll('input[type="radio"]');
    expect(radioInputs.length).toBe(3);
  });

  it('should update value when radio is selected', () => {
    component.options = [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
    ];
    fixture.detectChanges();

    component.onSelect('opt2');
    expect(component.value).toBe('opt2');
  });

  it('should call onChange when radio is selected', () => {
    const onChangeSpy = jasmine.createSpy('onChange');
    component.registerOnChange(onChangeSpy);

    component.onSelect('test-value');

    expect(onChangeSpy).toHaveBeenCalledWith('test-value');
  });

  it('should show required error when no selection', () => {
    component.validators = ['required'];
    component.value = null;
    component.onBlur();

    expect(component.touched).toBe(true);
    expect(component.errors).toContain('Field ini wajib diisi');
    expect(component.showError).toBe(true);
  });

  it('should disable radio group when disabled=true', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
  });

  it('should apply horizontal class when direction is horizontal', () => {
    component.direction = 'horizontal';
    fixture.detectChanges();

    const radioGroup = fixture.nativeElement.querySelector('.msv-radio-group');
    expect(radioGroup.classList.contains('horizontal')).toBe(true);
  });

  it('should apply vertical direction by default', () => {
    fixture.detectChanges();

    const radioGroup = fixture.nativeElement.querySelector('.msv-radio-group');
    expect(radioGroup.classList.contains('horizontal')).toBe(false);
  });

  it('should mark correct radio as checked', () => {
    component.options = [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
    ];
    component.value = 'opt2';
    fixture.detectChanges();

    expect(component.isChecked('opt2')).toBe(true);
    expect(component.isChecked('opt1')).toBe(false);
  });

  it('should not change value when disabled', () => {
    component.disabled = true;
    const initialValue = component.value;

    component.onSelect('new-value');

    expect(component.value).toBe(initialValue);
  });

  it('should generate unique name if not provided', () => {
    const component1 = new MsvRadioComponent(
      TestBed.inject(MsvValidatorHelper),
      TestBed.inject(MSV_FORMS_CONFIG)
    );
    const component2 = new MsvRadioComponent(
      TestBed.inject(MsvValidatorHelper),
      TestBed.inject(MSV_FORMS_CONFIG)
    );

    expect(component1.name).toBeDefined();
    expect(component2.name).toBeDefined();
    expect(component1.name).not.toBe(component2.name);
  });

  it('should call onTouched when blurred', () => {
    const onTouchedSpy = jasmine.createSpy('onTouched');
    component.registerOnTouched(onTouchedSpy);

    component.onBlur();

    expect(onTouchedSpy).toHaveBeenCalled();
  });

  it('should handle disabled option', () => {
    component.options = [
      { label: 'Option 1', value: 'opt1', disabled: true },
      { label: 'Option 2', value: 'opt2' },
    ];
    fixture.detectChanges();

    const radioInputs = fixture.nativeElement.querySelectorAll('input[type="radio"]');
    expect(radioInputs[0].disabled).toBe(true);
    expect(radioInputs[1].disabled).toBe(false);
  });

  it('should validate correctly', () => {
    component.validators = ['required'];
    component.value = null;
    
    const validationResult = component.validate({} as any);
    
    expect(validationResult).not.toBeNull();
    expect(validationResult?.['msvError']).toBe('Field ini wajib diisi');
  });

  it('should return null when validation passes', () => {
    component.validators = ['required'];
    component.value = 'some-value';
    
    const validationResult = component.validate({} as any);
    
    expect(validationResult).toBeNull();
  });
});

describe('MsvRadioComponent - errorTemplate', () => {
  @Component({
    template: `
      <msv-radio [validators]="['required']" [errorTemplate]="customError">
        <ng-template #customError let-errors>
          <span class="custom-error">Error: {{ errors[0] }}</span>
        </ng-template>
      </msv-radio>
    `,
  })
  class TestErrorHostComponent {}

  let fixture: ComponentFixture<TestErrorHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestErrorHostComponent, MsvRadioComponent],
      imports: [FormsModule],
      providers: [
        MsvValidatorHelper,
        {
          provide: MSV_FORMS_CONFIG,
          useValue: {
            validationMessages: {
              required: 'Field ini wajib diisi',
              email: 'Format email tidak valid',
              minLength: (min: number) => `Minimal ${min} karakter`,
              maxLength: (max: number) => `Maksimal ${max} karakter`,
              pattern: 'Format tidak valid',
              min: (min: number) => `Nilai minimal ${min}`,
              max: (max: number) => `Nilai maksimal ${max}`,
            },
            loadingText: 'Processing...',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestErrorHostComponent);
    fixture.detectChanges();
  });

  it('should render custom error template', () => {
    const radioComponent = fixture.debugElement.children[0].componentInstance;
    radioComponent.onBlur();
    fixture.detectChanges();

    const customError = fixture.nativeElement.querySelector('.custom-error');
    expect(customError).toBeTruthy();
    expect(customError.textContent).toContain('Error: Field ini wajib diisi');
  });
});
