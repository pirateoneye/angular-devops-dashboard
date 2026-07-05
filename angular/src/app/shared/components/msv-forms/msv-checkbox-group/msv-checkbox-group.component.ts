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
  selector: 'msv-checkbox-group',
  templateUrl: './msv-checkbox-group.component.html',
  styleUrls: ['./msv-checkbox-group.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MsvCheckboxGroupComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MsvCheckboxGroupComponent),
      multi: true,
    },
  ],
})
export class MsvCheckboxGroupComponent
  implements ControlValueAccessor, Validator, OnInit
{
  @Input() options: SelectOption[] = [];
  @Input() validators: ValidatorType[] = [];
  @Input() direction: 'horizontal' | 'vertical' = 'vertical';
  @Input() disabled: boolean = false;
  @Input() errorTemplate: TemplateRef<any> | null = null;

  value: any[] = [];
  touched: boolean = false;
  errors: string[] = [];

  private onChange: (value: any[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private validatorHelper: MsvValidatorHelper,
    @Inject(MSV_FORMS_CONFIG) private config: MsvFormsConfig,
  ) {}

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit(): void {}

  writeValue(value: any[]): void {
    this.value = Array.isArray(value) ? value : [];
  }

  registerOnChange(fn: (value: any[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    this.runValidation();
    return this.errors.length > 0 ? { msvError: this.errors[0] } : null;
  }

  onCheckboxChange(optionValue: any, event: Event): void {
    if (this.disabled) return;

    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;

    if (isChecked) {
      // Add value if not already in array
      if (!this.value.includes(optionValue)) {
        this.value = [...this.value, optionValue];
      }
    } else {
      // Remove value from array
      this.value = this.value.filter((v) => v !== optionValue);
    }

    this.onChange(this.value);
    this.runValidation();
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();
    this.runValidation();
  }

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

  isChecked(optionValue: any): boolean {
    return this.value.includes(optionValue);
  }
}
