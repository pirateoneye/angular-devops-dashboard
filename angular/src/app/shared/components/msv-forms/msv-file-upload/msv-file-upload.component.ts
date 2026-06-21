import { Component, Input, forwardRef, OnInit, TemplateRef, Inject, Output, EventEmitter } from '@angular/core';
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
  selector: 'msv-file-upload',
  templateUrl: './msv-file-upload.component.html',
  styleUrls: ['./msv-file-upload.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MsvFileUploadComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MsvFileUploadComponent),
      multi: true,
    },
  ],
})
export class MsvFileUploadComponent
  implements ControlValueAccessor, Validator, OnInit
{
  @Input() label: string = '';
  @Input() accept: string = '*/*';
  @Input() multiple: boolean = false;
  @Input() maxSize: number = 10485760; // 10MB default
  @Input() maxFiles: number = 10;
  @Input() validators: ValidatorType[] = [];
  @Input() disabled: boolean = false;
  @Input() errorTemplate: TemplateRef<any> | null = null;
  @Output() fileSelected = new EventEmitter<File[]>();

  value: File[] = [];
  touched: boolean = false;
  errors: string[] = [];
  isDragOver: boolean = false;

  private onChange: (value: File[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private validatorHelper: MsvValidatorHelper,
    @Inject(MSV_FORMS_CONFIG) private config: MsvFormsConfig
  ) {}

  ngOnInit(): void {}

  // ControlValueAccessor methods
  writeValue(value: File[]): void {
    this.value = value || [];
  }

  registerOnChange(fn: (value: File[]) => void): void {
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

  // Drag and drop handlers
  onDragOver(event: DragEvent): void {
    if (this.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    if (this.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    if (this.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFiles(Array.from(event.dataTransfer.files));
      event.dataTransfer.clearData();
    }
  }

  // File selection handler
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files));
      // Reset input to allow selecting the same file again
      input.value = '';
    }
  }

  // File handling logic
  private handleFiles(files: File[]): void {
    const validFiles: File[] = [];
    const fileErrors: string[] = [];

    for (const file of files) {
      // Check file type
      if (this.accept !== '*/*' && !this.isFileTypeValid(file)) {
        fileErrors.push(`File type not allowed: ${file.name}`);
        continue;
      }

      // Check file size
      if (file.size > this.maxSize) {
        fileErrors.push(`File too large: ${file.name} (max ${this.formatFileSize(this.maxSize)})`);
        continue;
      }

      validFiles.push(file);
    }

    // Check max files limit
    if (this.multiple) {
      const totalFiles = this.value.length + validFiles.length;
      if (totalFiles > this.maxFiles) {
        fileErrors.push(`Maximum ${this.maxFiles} files allowed`);
        const allowedCount = this.maxFiles - this.value.length;
        this.value = [...this.value, ...validFiles.slice(0, allowedCount)];
      } else {
        this.value = [...this.value, ...validFiles];
      }
    } else {
      this.value = validFiles.slice(0, 1);
    }

    // Update errors
    if (fileErrors.length > 0) {
      this.errors = fileErrors;
    } else {
      this.errors = [];
    }

    this.touched = true;
    this.onChange(this.value);
    this.onTouched();
    this.fileSelected.emit(this.value);
    this.runValidation();
  }

  // Remove file from list
  removeFile(index: number): void {
    if (this.disabled) return;
    this.value = this.value.filter((_, i) => i !== index);
    this.onChange(this.value);
    this.fileSelected.emit(this.value);
    this.runValidation();
  }

  // File type validation
  private isFileTypeValid(file: File): boolean {
    const acceptedTypes = this.accept.split(',').map(t => t.trim());
    
    for (const type of acceptedTypes) {
      if (type === '*/*') return true;
      
      // Check exact MIME type match
      if (type === file.type) return true;
      
      // Check wildcard MIME type (e.g., "image/*")
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0];
        if (file.type.startsWith(baseType + '/')) return true;
      }
      
      // Check file extension
      if (type.startsWith('.')) {
        if (file.name.toLowerCase().endsWith(type.toLowerCase())) return true;
      }
    }
    
    return false;
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Validation logic
  private runValidation(): void {
    const customErrors = this.validatorHelper.runValidation(this.value, this.validators, this.config);
    
    // Only add custom validator errors if no file-specific errors exist
    if (this.errors.length === 0) {
      this.errors = customErrors;
    }
  }

  get showError(): boolean {
    return this.touched && this.errors.length > 0;
  }

  // Trigger file input click
  triggerFileInput(fileInput: HTMLInputElement): void {
    if (!this.disabled) {
      fileInput.click();
    }
  }
}
