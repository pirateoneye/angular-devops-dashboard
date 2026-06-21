import { TestBed } from '@angular/core/testing';
import {
  MSV_FORMS_CONFIG,
  MsvFormsConfig,
  provideMsvFormsConfig,
  DEFAULT_MSV_FORMS_CONFIG,
  ValidatorConfig,
  CustomValidatorFn
} from './msv-forms.config';

describe('MSV Forms Configuration', () => {
  describe('DEFAULT_MSV_FORMS_CONFIG', () => {
    it('should have Indonesian validation messages matching current hardcoded values', () => {
      expect(DEFAULT_MSV_FORMS_CONFIG.validationMessages.required).toBe('Field ini wajib diisi');
      expect(DEFAULT_MSV_FORMS_CONFIG.validationMessages.email).toBe('Format email tidak valid');
      expect(DEFAULT_MSV_FORMS_CONFIG.validationMessages.pattern).toBe('Format tidak valid');
    });

    it('should have parameterized minLength message', () => {
      const message = DEFAULT_MSV_FORMS_CONFIG.validationMessages.minLength(5);
      expect(message).toBe('Minimal 5 karakter');
    });

    it('should have parameterized maxLength message', () => {
      const message = DEFAULT_MSV_FORMS_CONFIG.validationMessages.maxLength(10);
      expect(message).toBe('Maksimal 10 karakter');
    });

    it('should have default loading text', () => {
      expect(DEFAULT_MSV_FORMS_CONFIG.loadingText).toBe('Processing...');
    });
  });

  describe('MSV_FORMS_CONFIG InjectionToken', () => {
    it('should provide default config when injected', () => {
      TestBed.configureTestingModule({});
      const config = TestBed.inject(MSV_FORMS_CONFIG);
      
      expect(config).toBeDefined();
      expect(config.validationMessages.required).toBe('Field ini wajib diisi');
      expect(config.loadingText).toBe('Processing...');
    });

    it('should inject default config from factory without explicit provider', () => {
      TestBed.configureTestingModule({});
      const config = TestBed.inject(MSV_FORMS_CONFIG);
      
      expect(config).toEqual(DEFAULT_MSV_FORMS_CONFIG);
    });
  });

  describe('provideMsvFormsConfig', () => {
    it('should override validation messages', () => {
      const customConfig: Partial<MsvFormsConfig> = {
        validationMessages: {
          required: 'This field is required',
          email: 'Invalid email format',
          minLength: (min) => `Minimum ${min} characters`,
          maxLength: (max) => `Maximum ${max} characters`,
          pattern: 'Invalid format',
          min: (min) => `Minimum value ${min}`,
          max: (max) => `Maximum value ${max}`
        }
      };

      TestBed.configureTestingModule({
        providers: [provideMsvFormsConfig(customConfig)]
      });

      const config = TestBed.inject(MSV_FORMS_CONFIG);
      expect(config.validationMessages.required).toBe('This field is required');
      expect(config.validationMessages.email).toBe('Invalid email format');
      expect(config.validationMessages.minLength(5)).toBe('Minimum 5 characters');
    });

    it('should override loading text', () => {
      TestBed.configureTestingModule({
        providers: [provideMsvFormsConfig({ loadingText: 'Loading...' })]
      });

      const config = TestBed.inject(MSV_FORMS_CONFIG);
      expect(config.loadingText).toBe('Loading...');
    });

    it('should merge partial config with defaults', () => {
      TestBed.configureTestingModule({
        providers: [provideMsvFormsConfig({ loadingText: 'Custom Loading' })]
      });

      const config = TestBed.inject(MSV_FORMS_CONFIG);
      expect(config.loadingText).toBe('Custom Loading');
      // Should keep default validation messages
      expect(config.validationMessages.required).toBe('Field ini wajib diisi');
    });
  });

  describe('ValidatorConfig interface', () => {
    it('should allow object-based validator with type and message', () => {
      const validatorConfig: ValidatorConfig = {
        type: 'required',
        message: 'Custom required message'
      };

      expect(validatorConfig.type).toBe('required');
      expect(validatorConfig.message).toBe('Custom required message');
    });

    it('should allow validator with value for minLength', () => {
      const validatorConfig: ValidatorConfig = {
        type: 'minLength',
        value: 10,
        message: 'At least 10 chars'
      };

      expect(validatorConfig.value).toBe(10);
    });

    it('should allow validator with pattern string', () => {
      const validatorConfig: ValidatorConfig = {
        type: 'pattern',
        value: '^[0-9]+$'
      };

      expect(validatorConfig.value).toBe('^[0-9]+$');
    });

    it('should allow custom validator with function', () => {
      const customFn: CustomValidatorFn = (value: any) => {
        return value === 'test' ? null : 'Must be test';
      };

      const validatorConfig: ValidatorConfig = {
        type: 'custom',
        fn: customFn
      };

      expect(validatorConfig.fn).toBe(customFn);
      expect(validatorConfig.fn!('test')).toBeNull();
      expect(validatorConfig.fn!('other')).toBe('Must be test');
    });
  });

  describe('Type checking', () => {
    it('should accept ValidatorConfig type definition', () => {
      // This test verifies TypeScript compilation
      const config1: ValidatorConfig = { type: 'required' };
      const config2: ValidatorConfig = { type: 'email', message: 'Invalid' };
      const config3: ValidatorConfig = { type: 'minLength', value: 5 };
      const config4: ValidatorConfig = { type: 'maxLength', value: 100 };
      const config5: ValidatorConfig = { type: 'pattern', value: '^test' };
      const config6: ValidatorConfig = { 
        type: 'custom', 
        fn: (val) => val ? null : 'Error' 
      };

      expect(config1).toBeDefined();
      expect(config2).toBeDefined();
      expect(config3).toBeDefined();
      expect(config4).toBeDefined();
      expect(config5).toBeDefined();
      expect(config6).toBeDefined();
    });

    it('should accept CustomValidatorFn type definition', () => {
      const validatorFn: CustomValidatorFn = (value: any): string | null => {
        return value ? null : 'Required';
      };

      expect(validatorFn('test')).toBeNull();
      expect(validatorFn('')).toBe('Required');
    });
  });
});
