import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsvFileUploadComponent } from './msv-file-upload.component';
import { MsvValidatorHelper } from '../msv-validator.helper';
import { MSV_FORMS_CONFIG } from '../msv-forms.config';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('MsvFileUploadComponent', () => {
  let component: MsvFileUploadComponent;
  let fixture: ComponentFixture<MsvFileUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvFileUploadComponent],
      imports: [CommonModule, FormsModule],
      providers: [
        MsvValidatorHelper,
        {
          provide: MSV_FORMS_CONFIG,
          useValue: {
            inputErrorMessages: {},
            checkboxErrorMessages: {},
            textareaErrorMessages: {},
            selectErrorMessages: {},
            radioErrorMessages: {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvFileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ControlValueAccessor', () => {
    it('should write value correctly', () => {
      const files = [new File(['content'], 'test.txt')];
      component.writeValue(files);
      expect(component.value).toEqual(files);
    });

    it('should write empty array when value is null', () => {
      component.writeValue(null as any);
      expect(component.value).toEqual([]);
    });

    it('should register onChange callback', () => {
      const callback = jasmine.createSpy('onChange');
      component.registerOnChange(callback);
      component['onChange']([]);
      expect(callback).toHaveBeenCalledWith([]);
    });

    it('should register onTouched callback', () => {
      const callback = jasmine.createSpy('onTouched');
      component.registerOnTouched(callback);
      component['onTouched']();
      expect(callback).toHaveBeenCalled();
    });

    it('should set disabled state', () => {
      component.setDisabledState(true);
      expect(component.disabled).toBe(true);
      component.setDisabledState(false);
      expect(component.disabled).toBe(false);
    });
  });

  describe('File Selection', () => {
    it('should handle single file selection', () => {
      spyOn(component.fileSelected, 'emit');
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const event = {
        target: {
          files: [file],
          value: 'test.txt',
        },
      } as any;

      component.onFileSelected(event);
      expect(component.value.length).toBe(1);
      expect(component.value[0].name).toBe('test.txt');
      expect(component.fileSelected.emit).toHaveBeenCalledWith([file]);
    });

    it('should handle multiple file selection when multiple is true', () => {
      component.multiple = true;
      const files = [
        new File(['content1'], 'test1.txt'),
        new File(['content2'], 'test2.txt'),
      ];
      const event = {
        target: {
          files: files,
          value: '',
        },
      } as any;

      component.onFileSelected(event);
      expect(component.value.length).toBe(2);
    });

    it('should only keep one file when multiple is false', () => {
      component.multiple = false;
      const files = [
        new File(['content1'], 'test1.txt'),
        new File(['content2'], 'test2.txt'),
      ];
      const event = {
        target: {
          files: files,
          value: '',
        },
      } as any;

      component.onFileSelected(event);
      expect(component.value.length).toBe(1);
    });

    it('should reset input value after selection', () => {
      const file = new File(['content'], 'test.txt');
      const mockInput = { files: [file], value: 'test.txt' };
      const event = { target: mockInput } as any;

      component.onFileSelected(event);
      expect(mockInput.value).toBe('');
    });
  });

  describe('Drag and Drop', () => {
    it('should set isDragOver to true on dragover', () => {
      const event = new DragEvent('dragover');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      component.onDragOver(event);
      expect(component.isDragOver).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should set isDragOver to false on dragleave', () => {
      component.isDragOver = true;
      const event = new DragEvent('dragleave');
      spyOn(event, 'preventDefault');

      component.onDragLeave(event);
      expect(component.isDragOver).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle file drop', () => {
      spyOn(component.fileSelected, 'emit');
      const file = new File(['content'], 'test.txt');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      const event = new DragEvent('drop', { dataTransfer });
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      component.onDrop(event);
      expect(component.isDragOver).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.value.length).toBe(1);
    });

    it('should not handle drag events when disabled', () => {
      component.disabled = true;
      const initialDragState = component.isDragOver;
      
      const event = new DragEvent('dragover');
      spyOn(event, 'preventDefault');
      
      component.onDragOver(event);
      expect(component.isDragOver).toBe(initialDragState);
    });
  });

  describe('File Validation', () => {
    it('should reject files larger than maxSize', () => {
      component.maxSize = 100; // 100 bytes
      const largeFile = new File(['x'.repeat(200)], 'large.txt');
      const event = { target: { files: [largeFile], value: '' } } as any;

      component.onFileSelected(event);
      expect(component.value.length).toBe(0);
      expect(component.errors.length).toBeGreaterThan(0);
      expect(component.errors[0]).toContain('too large');
    });

    it('should accept files within maxSize limit', () => {
      component.maxSize = 10485760; // 10MB
      const smallFile = new File(['content'], 'small.txt');
      const event = { target: { files: [smallFile], value: '' } } as any;

      component.onFileSelected(event);
      expect(component.value.length).toBe(1);
    });

    it('should validate file type when accept is specified', () => {
      component.accept = '.txt';
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const event = { target: { files: [pdfFile], value: '' } } as any;

      component.onFileSelected(event);
      expect(component.value.length).toBe(0);
      expect(component.errors.length).toBeGreaterThan(0);
    });

    it('should accept valid file types', () => {
      component.accept = 'text/plain';
      const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const event = { target: { files: [txtFile], value: '' } } as any;

      component.onFileSelected(event);
      expect(component.value.length).toBe(1);
    });

    it('should enforce maxFiles limit in multiple mode', () => {
      component.multiple = true;
      component.maxFiles = 2;
      
      const files = [
        new File(['1'], 'file1.txt'),
        new File(['2'], 'file2.txt'),
        new File(['3'], 'file3.txt'),
      ];
      const event = { target: { files: files, value: '' } } as any;

      component.onFileSelected(event);
      expect(component.value.length).toBe(2);
      expect(component.errors.length).toBeGreaterThan(0);
    });

    it('should accept wildcard file types', () => {
      component.accept = 'image/*';
      const imageFile = new File(['content'], 'test.png', { type: 'image/png' });
      const event = { target: { files: [imageFile], value: '' } } as any;

      component.onFileSelected(event);
      expect(component.value.length).toBe(1);
    });
  });

  describe('File Removal', () => {
    it('should remove file at specified index', () => {
      spyOn(component.fileSelected, 'emit');
      component.value = [
        new File(['1'], 'file1.txt'),
        new File(['2'], 'file2.txt'),
      ];

      component.removeFile(0);
      expect(component.value.length).toBe(1);
      expect(component.value[0].name).toBe('file2.txt');
      expect(component.fileSelected.emit).toHaveBeenCalledWith(component.value);
    });

    it('should not remove file when disabled', () => {
      component.disabled = true;
      component.value = [new File(['1'], 'file1.txt')];

      component.removeFile(0);
      expect(component.value.length).toBe(1);
    });
  });

  describe('Utility Methods', () => {
    it('should format file size correctly', () => {
      expect(component.formatFileSize(0)).toBe('0 Bytes');
      expect(component.formatFileSize(1024)).toBe('1 KB');
      expect(component.formatFileSize(1048576)).toBe('1 MB');
      expect(component.formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should trigger file input click when not disabled', () => {
      const mockInput = { click: jasmine.createSpy('click') } as any;
      component.disabled = false;
      
      component.triggerFileInput(mockInput);
      expect(mockInput.click).toHaveBeenCalled();
    });

    it('should not trigger file input click when disabled', () => {
      const mockInput = { click: jasmine.createSpy('click') } as any;
      component.disabled = true;
      
      component.triggerFileInput(mockInput);
      expect(mockInput.click).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should return validation errors when files exceed limits', () => {
      // Manually set errors as the validation happens during file selection
      component.errors = ['File too large'];
      component.touched = true;
      
      const control = { value: component.value } as any;
      const result = component.validate(control);
      
      expect(result).toBeTruthy();
      expect(result?.['msvError']).toBe('File too large');
    });

    it('should show errors only when touched', () => {
      component.errors = ['Error message'];
      component.touched = false;
      expect(component.showError).toBe(false);

      component.touched = true;
      expect(component.showError).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file selection', () => {
      const event = { target: { files: [], value: '' } } as any;
      const initialLength = component.value.length;

      component.onFileSelected(event);
      expect(component.value.length).toBe(initialLength);
    });

    it('should handle null dataTransfer on drop', () => {
      const event = new DragEvent('drop', { dataTransfer: null });
      spyOn(event, 'preventDefault');

      const initialLength = component.value.length;
      component.onDrop(event);
      expect(component.value.length).toBe(initialLength);
    });

    it('should accumulate files in multiple mode', () => {
      component.multiple = true;
      component.value = [new File(['1'], 'file1.txt')];
      
      const newFile = new File(['2'], 'file2.txt');
      const event = { target: { files: [newFile], value: '' } } as any;

      component.onFileSelected(event);
      expect(component.value.length).toBe(2);
    });
  });
});
