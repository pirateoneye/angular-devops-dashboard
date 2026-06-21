import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { MsvCheckboxGroupComponent } from './msv-checkbox-group.component';
import { MsvValidatorHelper } from '../msv-validator.helper';
import { MSV_FORMS_CONFIG } from '../msv-forms.config';

describe('MsvCheckboxGroupComponent', () => {
  let component: MsvCheckboxGroupComponent;
  let fixture: ComponentFixture<MsvCheckboxGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvCheckboxGroupComponent],
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

    fixture = TestBed.createComponent(MsvCheckboxGroupComponent);
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

  it('should render checkbox options from input', () => {
    component.options = [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
      { label: 'Option 3', value: 'opt3' },
    ];
    fixture.detectChanges();

    const checkboxInputs = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
    expect(checkboxInputs.length).toBe(3);
  });

  it('should add value to array when checkbox is checked', () => {
    component.options = [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
    ];
    fixture.detectChanges();

    const event = { target: { checked: true } } as any;
    component.onCheckboxChange('opt2', event);

    expect(component.value).toContain('opt2');
  });

  it('should remove value from array when checkbox is unchecked', () => {
    component.value = ['opt1', 'opt2'];
    fixture.detectChanges();

    const event = { target: { checked: false } } as any;
    component.onCheckboxChange('opt2', event);

    expect(component.value).not.toContain('opt2');
    expect(component.value).toContain('opt1');
  });

  it('should call onChange when checkbox selection changes', () => {
    const onChangeSpy = jasmine.createSpy('onChange');
    component.registerOnChange(onChangeSpy);

    const event = { target: { checked: true } } as any;
    component.onCheckboxChange('opt1', event);

    expect(onChangeSpy).toHaveBeenCalledWith(['opt1']);
  });

  it('should handle multiple selected values', () => {
    const onChangeSpy = jasmine.createSpy('onChange');
    component.registerOnChange(onChangeSpy);

    const event1 = { target: { checked: true } } as any;
    component.onCheckboxChange('opt1', event1);
    
    const event2 = { target: { checked: true } } as any;
    component.onCheckboxChange('opt2', event2);

    expect(component.value).toEqual(['opt1', 'opt2']);
  });

  it('should show required error when no checkboxes are selected', () => {
    component.validators = ['required'];
    component.value = [];
    component.onBlur();

    expect(component.touched).toBe(true);
    expect(component.errors).toContain('Field ini wajib diisi');
    expect(component.showError).toBe(true);
  });

  it('should disable checkbox group when disabled=true', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
  });

  it('should apply horizontal class when direction is horizontal', () => {
    component.direction = 'horizontal';
    fixture.detectChanges();

    const checkboxGroup = fixture.nativeElement.querySelector('.msv-checkbox-group');
    expect(checkboxGroup.classList.contains('horizontal')).toBe(true);
  });

  it('should apply vertical direction by default', () => {
    fixture.detectChanges();

    const checkboxGroup = fixture.nativeElement.querySelector('.msv-checkbox-group');
    expect(checkboxGroup.classList.contains('horizontal')).toBe(false);
  });

  it('should mark correct checkboxes as checked', () => {
    component.options = [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
    ];
    component.value = ['opt2'];
    fixture.detectChanges();

    expect(component.isChecked('opt2')).toBe(true);
    expect(component.isChecked('opt1')).toBe(false);
  });

  it('should not change value when disabled', () => {
    component.disabled = true;
    const initialValue = [...component.value];

    const event = { target: { checked: true } } as any;
    component.onCheckboxChange('opt1', event);

    expect(component.value).toEqual(initialValue);
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

    const checkboxInputs = fixture.nativeElement.querySelectorAll('input[type="checkbox"]');
    expect(checkboxInputs[0].disabled).toBe(true);
    expect(checkboxInputs[1].disabled).toBe(false);
  });

  it('should validate correctly', () => {
    component.validators = ['required'];
    component.value = [];
    
    const validationResult = component.validate({} as any);
    
    expect(validationResult).not.toBeNull();
    expect(validationResult?.['msvError']).toBe('Field ini wajib diisi');
  });

  it('should return null when validation passes', () => {
    component.validators = ['required'];
    component.value = ['opt1'];
    
    const validationResult = component.validate({} as any);
    
    expect(validationResult).toBeNull();
  });

  it('should initialize with empty array when writeValue receives null', () => {
    component.writeValue(null as any);
    expect(component.value).toEqual([]);
  });

  it('should initialize with empty array when writeValue receives undefined', () => {
    component.writeValue(undefined as any);
    expect(component.value).toEqual([]);
  });

  it('should initialize with array when writeValue receives array', () => {
    component.writeValue(['opt1', 'opt2']);
    expect(component.value).toEqual(['opt1', 'opt2']);
  });

  it('should not add duplicate values', () => {
    component.value = ['opt1'];
    
    const event = { target: { checked: true } } as any;
    component.onCheckboxChange('opt1', event);

    expect(component.value).toEqual(['opt1']);
  });
});

describe('MsvCheckboxGroupComponent - errorTemplate', () => {
  @Component({
    template: `
      <msv-checkbox-group [validators]="['required']" [errorTemplate]="customError">
        <ng-template #customError let-errors>
          <span class="custom-error">Error: {{ errors[0] }}</span>
        </ng-template>
      </msv-checkbox-group>
    `,
  })
  class TestErrorHostComponent {}

  let fixture: ComponentFixture<TestErrorHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestErrorHostComponent, MsvCheckboxGroupComponent],
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
    const checkboxGroupComponent = fixture.debugElement.children[0].componentInstance;
    checkboxGroupComponent.onBlur();
    fixture.detectChanges();

    const customError = fixture.nativeElement.querySelector('.custom-error');
    expect(customError).toBeTruthy();
    expect(customError.textContent).toContain('Error: Field ini wajib diisi');
  });
});
