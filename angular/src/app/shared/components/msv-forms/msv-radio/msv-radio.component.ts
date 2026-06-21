import {
  Component,
  Input,
  forwardRef,
  OnInit,
  Inject,
  TemplateRef,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ValidatorType, SelectOption } from '../interfaces';
import { MsvValidatorHelper } from '../msv-validator.helper';
import { MSV_FORMS_CONFIG, MsvFormsConfig } from '../msv-forms.config';

@Component({
  selector: 'msv-radio',
  templateUrl: './msv-radio.component.html',
  styleUrls: ['./msv-radio.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MsvRadioComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MsvRadioComponent),
      multi: true,
    },
  ],
})
export class MsvRadioComponent
  implements ControlValueAccessor, Validator, OnInit
{
  @Input() options: SelectOption[] = [];
  @Input() name: string = 'msv-radio-' + Math.random().toString(36).substr(2, 9);
  @Input() validators: ValidatorType[] = [];
  @Input() direction: 'horizontal' | 'vertical' = 'vertical';
  @Input() disabled: boolean = false;
  @Input() errorTemplate: TemplateRef<any> | null = null;

  value: any = null;
  touched: boolean = false;
  errors: string[] = [];

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private validatorHelper: MsvValidatorHelper,
    @Inject(MSV_FORMS_CONFIG) private config: MsvFormsConfig
  ) {}

  ngOnInit(): void {}

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    this.runValidation();
    return this.errors.length > 0 ? { msvError: this.errors[0] } : null;
  }

  onSelect(optionValue: any): void {
    if (this.disabled) return;
    
    this.value = optionValue;
    this.onChange(this.value);
    this.runValidation();
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();
    this.runValidation();
  }

  private runValidation(): void {
    this.errors = this.validatorHelper.runValidation(this.value, this.validators, this.config);
  }

  get showError(): boolean {
    return this.touched && this.errors.length > 0;
  }

  isChecked(optionValue: any): boolean {
    return this.value === optionValue;
  }
}
