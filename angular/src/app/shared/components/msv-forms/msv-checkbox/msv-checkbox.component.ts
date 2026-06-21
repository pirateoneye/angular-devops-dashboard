import { Component, Input, forwardRef, OnInit, TemplateRef, Inject } from '@angular/core';
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
  selector: 'msv-checkbox',
  templateUrl: './msv-checkbox.component.html',
  styleUrls: ['./msv-checkbox.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MsvCheckboxComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MsvCheckboxComponent),
      multi: true,
    },
  ],
})
export class MsvCheckboxComponent
  implements ControlValueAccessor, Validator, OnInit
{
  @Input() label: string = '';
  @Input() validators: ValidatorType[] = [];
  @Input() disabled: boolean = false;
  @Input() errorTemplate: TemplateRef<any> | null = null;

  value: boolean = false;
  touched: boolean = false;
  errors: string[] = [];

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private validatorHelper: MsvValidatorHelper,
    @Inject(MSV_FORMS_CONFIG) private config: MsvFormsConfig
  ) {}

  ngOnInit(): void {}

  // ControlValueAccessor methods
  writeValue(value: boolean): void {
    this.value = value || false;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Validator implementation
  validate(control: AbstractControl): ValidationErrors | null {
    this.runValidation();
    return this.errors.length > 0 ? { msvError: this.errors[0] } : null;
  }

  // Event handlers
  onCheckboxChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.checked;
    this.onChange(this.value);
    this.runValidation();
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();
    this.runValidation();
  }

  // Validation logic
  private runValidation(): void {
    this.errors = [];
    
    for (const validator of this.validators) {
      // Handle string-based validators
      if (typeof validator === 'string') {
        // Special handling for required validator with boolean values
        if (validator === 'required' && !this.value) {
          this.errors.push(this.config.validationMessages.required);
          continue;
        }
      } 
      // Handle object-based validators
      else {
        const { type, message, fn } = validator;
        
        // Custom validator
        if (type === 'custom' && fn) {
          const error = fn(this.value);
          if (error) {
            this.errors.push(error);
          }
          continue;
        }
        
        // Required validator for boolean
        if (type === 'required' && !this.value) {
          this.errors.push(message || this.config.validationMessages.required);
          continue;
        }
      }
    }
  }

  get showError(): boolean {
    return this.touched && this.errors.length > 0;
  }
}
