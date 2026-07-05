import {
  Component,
  Input,
  forwardRef,
  OnInit,
  TemplateRef,
  Inject,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ValidatorType } from '../interfaces';
import { MsvValidatorHelper } from '../msv-validator.helper';
import { MSV_FORMS_CONFIG, MsvFormsConfig } from '../msv-forms.config';

@Component({
  selector: 'msv-number',
  templateUrl: './msv-number.component.html',
  styleUrls: ['./msv-number.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MsvNumberComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MsvNumberComponent),
      multi: true,
    },
  ],
})
export class MsvNumberComponent
  implements ControlValueAccessor, Validator, OnInit
{
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() min: number | undefined;
  @Input() max: number | undefined;
  @Input() step: number = 1;
  @Input() showButtons: boolean = true;
  @Input() validators: ValidatorType[] = [];
  @Input() disabled: boolean = false;
  @Input() errorTemplate: TemplateRef<any> | null = null;

  value: number | null = null;
  displayValue: string = '';
  touched: boolean = false;
  errors: string[] = [];

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private validatorHelper: MsvValidatorHelper,
    @Inject(MSV_FORMS_CONFIG) private config: MsvFormsConfig,
  ) {}

  ngOnInit(): void {
    // Add min/max validators if provided
    if (this.min !== undefined) {
      this.validators.push(`min:${this.min}`);
    }
    if (this.max !== undefined) {
      this.validators.push(`max:${this.max}`);
    }
  }

  // ControlValueAccessor methods
  writeValue(value: number | null): void {
    this.value = value;
    this.displayValue =
      value !== null && value !== undefined ? String(value) : '';
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Validator implementation
  validate(_control: AbstractControl): ValidationErrors | null {
    this.runValidation();
    return this.errors.length > 0 ? { msvError: this.errors[0] } : null;
  }

  // Event handlers
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value;

    // Allow empty string
    if (inputValue === '' || inputValue === '-') {
      this.displayValue = inputValue;
      this.value = null;
      this.onChange(null);
      this.runValidation();
      return;
    }

    // Validate numeric input (allow numbers, negative sign, decimal point)
    const numericRegex = /^-?\d*\.?\d*$/;
    if (!numericRegex.test(inputValue)) {
      // Revert to last valid value
      input.value = this.displayValue;
      return;
    }

    this.displayValue = inputValue;
    const numValue = parseFloat(inputValue);

    if (!isNaN(numValue)) {
      this.value = numValue;
      this.onChange(numValue);
    } else {
      this.value = null;
      this.onChange(null);
    }

    this.runValidation();
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();

    // Clean up display value on blur
    if (this.value !== null) {
      this.displayValue = String(this.value);
    }

    this.runValidation();
  }

  // Increment/Decrement handlers
  increment(): void {
    if (this.disabled || this.atMax) {
      return;
    }

    const currentValue = this.value ?? 0;
    let newValue = currentValue + this.step;

    // Respect max constraint
    if (this.max !== undefined && newValue > this.max) {
      newValue = this.max;
    }

    this.value = newValue;
    this.displayValue = String(newValue);
    this.onChange(newValue);
    this.runValidation();
  }

  decrement(): void {
    if (this.disabled || this.atMin) {
      return;
    }

    const currentValue = this.value ?? 0;
    let newValue = currentValue - this.step;

    // Respect min constraint
    if (this.min !== undefined && newValue < this.min) {
      newValue = this.min;
    }

    this.value = newValue;
    this.displayValue = String(newValue);
    this.onChange(newValue);
    this.runValidation();
  }

  // Validation logic
  private runValidation(): void {
    this.errors = this.validatorHelper.runValidation(
      this.value,
      this.validators,
      this.config,
    );
  }

  get showError(): boolean {
    return this.touched && this.errors.length > 0;
  }

  get atMin(): boolean {
    return (
      this.min !== undefined && this.value !== null && this.value <= this.min
    );
  }

  get atMax(): boolean {
    return (
      this.max !== undefined && this.value !== null && this.value >= this.max
    );
  }
}
