import { TestBed } from '@angular/core/testing';
import { MsvValidatorHelper } from './msv-validator.helper';
import {
  MSV_FORMS_CONFIG,
  MsvFormsConfig,
  DEFAULT_MSV_FORMS_CONFIG,
} from './msv-forms.config';
import { ValidatorType, CustomValidatorFn } from './interfaces';

describe('MsvValidatorHelper', () => {
  let service: MsvValidatorHelper;
  let config: MsvFormsConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MsvValidatorHelper,
        { provide: MSV_FORMS_CONFIG, useValue: DEFAULT_MSV_FORMS_CONFIG },
      ],
    });
    service = TestBed.inject(MsvValidatorHelper);
    config = TestBed.inject(MSV_FORMS_CONFIG);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('String DSL Validators', () => {
    describe('required validator', () => {
      it('should return error when value is empty string', () => {
        const validators: ValidatorType[] = ['required'];
        const errors = service.runValidation('', validators, config);
        expect(errors).toEqual(['Field ini wajib diisi']);
      });

      it('should return error when value is null', () => {
        const validators: ValidatorType[] = ['required'];
        const errors = service.runValidation(null, validators, config);
        expect(errors).toEqual(['Field ini wajib diisi']);
      });

      it('should return error when value is undefined', () => {
        const validators: ValidatorType[] = ['required'];
        const errors = service.runValidation(undefined, validators, config);
        expect(errors).toEqual(['Field ini wajib diisi']);
      });

      it('should pass when value is non-empty string', () => {
        const validators: ValidatorType[] = ['required'];
        const errors = service.runValidation('test', validators, config);
        expect(errors).toEqual([]);
      });

      it('should pass when value is 0', () => {
        const validators: ValidatorType[] = ['required'];
        const errors = service.runValidation(0, validators, config);
        expect(errors).toEqual([]);
      });
    });

    describe('email validator', () => {
      it('should return error for invalid email', () => {
        const validators: ValidatorType[] = ['email'];
        const errors = service.runValidation(
          'invalid-email',
          validators,
          config,
        );
        expect(errors).toEqual(['Format email tidak valid']);
      });

      it('should pass for valid email', () => {
        const validators: ValidatorType[] = ['email'];
        const errors = service.runValidation(
          'test@example.com',
          validators,
          config,
        );
        expect(errors).toEqual([]);
      });

      it('should pass when value is empty (email only validates non-empty)', () => {
        const validators: ValidatorType[] = ['email'];
        const errors = service.runValidation('', validators, config);
        expect(errors).toEqual([]);
      });

      it('should return error for email without @', () => {
        const validators: ValidatorType[] = ['email'];
        const errors = service.runValidation(
          'testexample.com',
          validators,
          config,
        );
        expect(errors).toEqual(['Format email tidak valid']);
      });

      it('should return error for email without domain', () => {
        const validators: ValidatorType[] = ['email'];
        const errors = service.runValidation('test@', validators, config);
        expect(errors).toEqual(['Format email tidak valid']);
      });
    });

    describe('minLength validator', () => {
      it('should return error when value length is less than min', () => {
        const validators: ValidatorType[] = ['minLength:5'];
        const errors = service.runValidation('abc', validators, config);
        expect(errors).toEqual(['Minimal 5 karakter']);
      });

      it('should pass when value length equals min', () => {
        const validators: ValidatorType[] = ['minLength:5'];
        const errors = service.runValidation('abcde', validators, config);
        expect(errors).toEqual([]);
      });

      it('should pass when value length is greater than min', () => {
        const validators: ValidatorType[] = ['minLength:5'];
        const errors = service.runValidation('abcdef', validators, config);
        expect(errors).toEqual([]);
      });

      it('should pass when value is empty (minLength only validates non-empty)', () => {
        const validators: ValidatorType[] = ['minLength:5'];
        const errors = service.runValidation('', validators, config);
        expect(errors).toEqual([]);
      });
    });

    describe('maxLength validator', () => {
      it('should return error when value length is greater than max', () => {
        const validators: ValidatorType[] = ['maxLength:5'];
        const errors = service.runValidation('abcdef', validators, config);
        expect(errors).toEqual(['Maksimal 5 karakter']);
      });

      it('should pass when value length equals max', () => {
        const validators: ValidatorType[] = ['maxLength:5'];
        const errors = service.runValidation('abcde', validators, config);
        expect(errors).toEqual([]);
      });

      it('should pass when value length is less than max', () => {
        const validators: ValidatorType[] = ['maxLength:5'];
        const errors = service.runValidation('abc', validators, config);
        expect(errors).toEqual([]);
      });

      it('should pass when value is empty', () => {
        const validators: ValidatorType[] = ['maxLength:5'];
        const errors = service.runValidation('', validators, config);
        expect(errors).toEqual([]);
      });
    });

    describe('pattern validator', () => {
      it('should return error when value does not match pattern', () => {
        const validators: ValidatorType[] = ['pattern:^[0-9]+$'];
        const errors = service.runValidation('abc', validators, config);
        expect(errors).toEqual(['Format tidak valid']);
      });

      it('should pass when value matches pattern', () => {
        const validators: ValidatorType[] = ['pattern:^[0-9]+$'];
        const errors = service.runValidation('12345', validators, config);
        expect(errors).toEqual([]);
      });

      it('should pass when value is empty (pattern only validates non-empty)', () => {
        const validators: ValidatorType[] = ['pattern:^[0-9]+$'];
        const errors = service.runValidation('', validators, config);
        expect(errors).toEqual([]);
      });

      it('should handle complex regex patterns', () => {
        const validators: ValidatorType[] = ['pattern:^[A-Z][a-z]+$'];
        const errors1 = service.runValidation('Hello', validators, config);
        expect(errors1).toEqual([]);

        const errors2 = service.runValidation('hello', validators, config);
        expect(errors2).toEqual(['Format tidak valid']);
      });
    });
  });

  describe('Object-based ValidatorConfig', () => {
    describe('required validator with custom message', () => {
      it('should use custom message when provided', () => {
        const validators: ValidatorType[] = [
          { type: 'required', message: 'This is required!' },
        ];
        const errors = service.runValidation('', validators, config);
        expect(errors).toEqual(['This is required!']);
      });

      it('should use config default message when not provided', () => {
        const validators: ValidatorType[] = [{ type: 'required' }];
        const errors = service.runValidation('', validators, config);
        expect(errors).toEqual(['Field ini wajib diisi']);
      });
    });

    describe('email validator with custom message', () => {
      it('should use custom message when provided', () => {
        const validators: ValidatorType[] = [
          { type: 'email', message: 'Email must be valid!' },
        ];
        const errors = service.runValidation('invalid', validators, config);
        expect(errors).toEqual(['Email must be valid!']);
      });

      it('should use config default message when not provided', () => {
        const validators: ValidatorType[] = [{ type: 'email' }];
        const errors = service.runValidation('invalid', validators, config);
        expect(errors).toEqual(['Format email tidak valid']);
      });
    });

    describe('minLength validator with object config', () => {
      it('should validate using value property', () => {
        const validators: ValidatorType[] = [{ type: 'minLength', value: 5 }];
        const errors = service.runValidation('abc', validators, config);
        expect(errors).toEqual(['Minimal 5 karakter']);
      });

      it('should use custom message when provided', () => {
        const validators: ValidatorType[] = [
          { type: 'minLength', value: 5, message: 'Too short!' },
        ];
        const errors = service.runValidation('abc', validators, config);
        expect(errors).toEqual(['Too short!']);
      });
    });

    describe('maxLength validator with object config', () => {
      it('should validate using value property', () => {
        const validators: ValidatorType[] = [{ type: 'maxLength', value: 5 }];
        const errors = service.runValidation('abcdef', validators, config);
        expect(errors).toEqual(['Maksimal 5 karakter']);
      });

      it('should use custom message when provided', () => {
        const validators: ValidatorType[] = [
          { type: 'maxLength', value: 5, message: 'Too long!' },
        ];
        const errors = service.runValidation('abcdef', validators, config);
        expect(errors).toEqual(['Too long!']);
      });
    });

    describe('pattern validator with object config', () => {
      it('should validate using value property as pattern', () => {
        const validators: ValidatorType[] = [
          { type: 'pattern', value: '^[0-9]+$' },
        ];
        const errors = service.runValidation('abc', validators, config);
        expect(errors).toEqual(['Format tidak valid']);
      });

      it('should use custom message when provided', () => {
        const validators: ValidatorType[] = [
          {
            type: 'pattern',
            value: '^[0-9]+$',
            message: 'Only numbers allowed!',
          },
        ];
        const errors = service.runValidation('abc', validators, config);
        expect(errors).toEqual(['Only numbers allowed!']);
      });
    });

    describe('custom validator', () => {
      it('should run custom validation function', () => {
        const customFn: CustomValidatorFn = (value: any) => {
          return value === 'secret' ? null : 'Invalid secret code';
        };
        const validators: ValidatorType[] = [{ type: 'custom', fn: customFn }];

        const errors1 = service.runValidation('wrong', validators, config);
        expect(errors1).toEqual(['Invalid secret code']);

        const errors2 = service.runValidation('secret', validators, config);
        expect(errors2).toEqual([]);
      });

      it('should use custom message from fn result', () => {
        const customFn: CustomValidatorFn = (value: any) => {
          if (!value) return 'Value is required';
          if (value.length < 3) return 'Too short';
          return null;
        };
        const validators: ValidatorType[] = [{ type: 'custom', fn: customFn }];

        const errors = service.runValidation('ab', validators, config);
        expect(errors).toEqual(['Too short']);
      });

      it('should handle custom validator returning null', () => {
        const customFn: CustomValidatorFn = (_value: any) => null;
        const validators: ValidatorType[] = [{ type: 'custom', fn: customFn }];

        const errors = service.runValidation('anything', validators, config);
        expect(errors).toEqual([]);
      });
    });
  });

  describe('Multiple validators', () => {
    it('should accumulate all errors from multiple validators', () => {
      const validators: ValidatorType[] = ['required', 'email', 'minLength:5'];
      const errors = service.runValidation('', validators, config);
      expect(errors.length).toBe(1); // Only required fails
      expect(errors).toEqual(['Field ini wajib diisi']);
    });

    it('should validate all validators when value is present', () => {
      const validators: ValidatorType[] = ['required', 'email', 'minLength:10'];
      const errors = service.runValidation('abc', validators, config);
      expect(errors.length).toBe(2); // email and minLength fail
      expect(errors).toContain('Format email tidak valid');
      expect(errors).toContain('Minimal 10 karakter');
    });

    it('should mix string and object validators', () => {
      const validators: ValidatorType[] = [
        'required',
        { type: 'minLength', value: 5, message: 'Min 5 chars' },
        'email',
      ];
      const errors = service.runValidation('abc', validators, config);
      expect(errors).toContain('Min 5 chars');
      expect(errors).toContain('Format email tidak valid');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty validators array', () => {
      const validators: ValidatorType[] = [];
      const errors = service.runValidation('anything', validators, config);
      expect(errors).toEqual([]);
    });

    it('should handle null validators gracefully', () => {
      const validators: ValidatorType[] = ['required'];
      const errors = service.runValidation(null, validators, config);
      expect(errors).toEqual(['Field ini wajib diisi']);
    });

    it('should handle undefined value gracefully', () => {
      const validators: ValidatorType[] = ['required'];
      const errors = service.runValidation(undefined, validators, config);
      expect(errors).toEqual(['Field ini wajib diisi']);
    });

    it('should handle numeric values', () => {
      const validators: ValidatorType[] = ['required'];
      const errors = service.runValidation(123, validators, config);
      expect(errors).toEqual([]);
    });

    it('should handle boolean values', () => {
      const validators: ValidatorType[] = ['required'];
      const errors = service.runValidation(false, validators, config);
      expect(errors).toEqual([]);
    });

    it('should handle whitespace-only strings for required', () => {
      const validators: ValidatorType[] = ['required'];
      const errors = service.runValidation('   ', validators, config);
      expect(errors).toEqual([]); // Whitespace is truthy, so it passes
    });
  });
});
