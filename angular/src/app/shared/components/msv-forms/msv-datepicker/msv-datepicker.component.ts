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
import { FormsModule } from '@angular/forms';
import { ValidatorType } from '../interfaces';
import { MsvValidatorHelper } from '../msv-validator.helper';
import { MSV_FORMS_CONFIG, MsvFormsConfig } from '../msv-forms.config';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  standalone: true,
  selector: 'msv-datepicker',
  imports: [CommonModule, FormsModule, MatInputModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './msv-datepicker.component.html',
  styleUrls: ['./msv-datepicker.component.css'],
  providers: [
  {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MsvDatepickerComponent),
    multi: true,
  },
  {
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => MsvDatepickerComponent),
    multi: true,
  },
],})
export class MsvDatepickerComponent
  implements ControlValueAccessor, Validator, OnInit
{
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;
  @Input() validators: ValidatorType[] = [];
  @Input() disabled: boolean = false;
  @Input() errorTemplate: TemplateRef<any> | null = null;

  value: Date | null = null;
  touched: boolean = false;
  errors: string[] = [];

  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private validatorHelper: MsvValidatorHelper,
    @Inject(MSV_FORMS_CONFIG) private config: MsvFormsConfig,
  ) {}

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit(): void {}

  // ControlValueAccessor methods
  writeValue(value: Date | null): void {
    this.value = value || null;
  }

  registerOnChange(fn: (value: Date | null) => void): void {
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
  onDateChange(event: any): void {
    this.value = event.value;
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
    this.errors = this.validatorHelper.runValidation(
      this.value,
      this.validators,
      this.config,
    );
  }

  get showError(): boolean {
    return this.touched && this.errors.length > 0;
  }
}
