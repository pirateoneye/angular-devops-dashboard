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
  selector: 'msv-input',
  templateUrl: './msv-input.component.html',
  styleUrls: ['./msv-input.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MsvInputComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MsvInputComponent),
      multi: true,
    },
  ],
})
export class MsvInputComponent
  implements ControlValueAccessor, Validator, OnInit
{
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' = 'text';
  @Input() validators: ValidatorType[] = [];
  @Input() disabled: boolean = false;
  @Input() errorTemplate: TemplateRef<any> | null = null;

  value: string = '';
  touched: boolean = false;
  errors: string[] = [];

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private validatorHelper: MsvValidatorHelper,
    @Inject(MSV_FORMS_CONFIG) private config: MsvFormsConfig
  ) {}

  ngOnInit(): void {}

  // ControlValueAccessor methods
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
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
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
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
    this.errors = this.validatorHelper.runValidation(this.value, this.validators, this.config);
  }

  get showError(): boolean {
    return this.touched && this.errors.length > 0;
  }
}
