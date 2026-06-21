import {
  Component,
  Input,
  Output,
  EventEmitter,
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
  selector: 'msv-select',
  templateUrl: './msv-select.component.html',
  styleUrls: ['./msv-select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MsvSelectComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MsvSelectComponent),
      multi: true,
    },
  ],
})
export class MsvSelectComponent
  implements ControlValueAccessor, Validator, OnInit
{
  @Input() label: string = '';
  @Input() placeholder: string = 'Pilih...';
  @Input() options: SelectOption[] = [];
  @Input() validators: ValidatorType[] = [];
  @Input() disabled: boolean = false;
  @Input() optionTemplate: TemplateRef<any> | null = null;
  @Input() errorTemplate: TemplateRef<any> | null = null;

  @Output() selectionChange = new EventEmitter<any>();

  value: any = '';
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
    this.value = value ?? '';
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

  onSelectionChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.value = select.value;
    this.onChange(this.value);
    this.selectionChange.emit(this.value);
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
}
