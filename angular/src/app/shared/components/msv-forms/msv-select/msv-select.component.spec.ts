import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { MsvSelectComponent } from './msv-select.component';
import { MsvValidatorHelper } from '../msv-validator.helper';
import { MSV_FORMS_CONFIG } from '../msv-forms.config';

describe('MsvSelectComponent', () => {
  let component: MsvSelectComponent;
  let fixture: ComponentFixture<MsvSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvSelectComponent],
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
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvSelectComponent);
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

  it('should render options from input', () => {
    component.options = [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
    ];
    fixture.detectChanges();

    const selectElement = fixture.nativeElement.querySelector('select');
    // +1 for placeholder option
    expect(selectElement.options.length).toBe(3);
  });

  it('should emit selectionChange on selection', () => {
    spyOn(component.selectionChange, 'emit');
    component.onSelectionChange({ target: { value: 'test' } } as any);

    expect(component.selectionChange.emit).toHaveBeenCalledWith('test');
  });

  it('should show required error when no selection', () => {
    component.validators = ['required'];
    component.value = '';
    component.onBlur();

    expect(component.touched).toBe(true);
    expect(component.errors).toContain('Field ini wajib diisi');
    expect(component.showError).toBe(true);
  });

  it('should disable select when disabled=true', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
  });

  it('should render placeholder option', () => {
    component.placeholder = 'Select an option';
    fixture.detectChanges();

    const selectElement = fixture.nativeElement.querySelector('select');
    const placeholderOption = selectElement.options[0];
    expect(placeholderOption.textContent.trim()).toBe('Select an option');
    expect(placeholderOption.disabled).toBe(true);
  });

  it('should render label when provided', () => {
    component.label = 'Test Label';
    fixture.detectChanges();

    const labelElement =
      fixture.nativeElement.querySelector('.msv-select-label');
    expect(labelElement.textContent).toBe('Test Label');
  });
});

describe('MsvSelectComponent - optionTemplate', () => {
  @Component({
    template: `
      <msv-select [options]="options" [optionTemplate]="customOption">
        <ng-template #customOption let-option>
          [{{ option.value }}] {{ option.label }}
        </ng-template>
      </msv-select>
    `,
  })
  class TestHostComponent {
    options = [
      { label: 'Option 1', value: 'opt1' },
      { label: 'Option 2', value: 'opt2' },
    ];
  }

  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestHostComponent, MsvSelectComponent],
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
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should render custom option template', () => {
    const selectElement = fixture.nativeElement.querySelector('select');
    // Check that options are rendered (placeholder + 2 options)
    expect(selectElement.options.length).toBe(3);
  });
});

describe('MsvSelectComponent - errorTemplate', () => {
  @Component({
    template: `
      <msv-select [validators]="['required']" [errorTemplate]="customError">
        <ng-template #customError let-errors>
          <span class="custom-error">Error: {{ errors[0] }}</span>
        </ng-template>
      </msv-select>
    `,
  })
  class TestErrorHostComponent {}

  let fixture: ComponentFixture<TestErrorHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestErrorHostComponent, MsvSelectComponent],
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
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestErrorHostComponent);
    fixture.detectChanges();
  });

  it('should render custom error template', () => {
    const selectComponent = fixture.debugElement.children[0].componentInstance;
    selectComponent.onBlur();
    fixture.detectChanges();

    const customError = fixture.nativeElement.querySelector('.custom-error');
    expect(customError).toBeTruthy();
    expect(customError.textContent).toContain('Error: Field ini wajib diisi');
  });
});
