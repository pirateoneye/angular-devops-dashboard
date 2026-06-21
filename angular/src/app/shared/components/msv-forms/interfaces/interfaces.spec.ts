import { SelectOption, ResponseData, ValidatorType } from './index';

describe('MsvForms Interfaces', () => {
  describe('SelectOption', () => {
    it('should accept valid object with label and value', () => {
      const option: SelectOption = { label: 'Test', value: 'test' };
      expect(option.label).toBe('Test');
      expect(option.value).toBe('test');
    });

    it('should accept optional disabled property', () => {
      const option: SelectOption = {
        label: 'Test',
        value: 'test',
        disabled: true,
      };
      expect(option.disabled).toBe(true);
    });

    it('should accept value as number', () => {
      const option: SelectOption = { label: 'Number Option', value: 42 };
      expect(option.value).toBe(42);
    });

    it('should accept value as object', () => {
      const option: SelectOption = {
        label: 'Object Option',
        value: { id: 1, name: 'test' },
      };
      expect(option.value).toEqual({ id: 1, name: 'test' });
    });

    it('should have disabled as undefined when not provided', () => {
      const option: SelectOption = { label: 'Test', value: 'test' };
      expect(option.disabled).toBeUndefined();
    });
  });

  describe('ResponseData', () => {
    it('should accept SUCCESS status', () => {
      const response: ResponseData = {
        status: 'SUCCESS',
        message: 'Done',
        data: {},
      };
      expect(response.status).toBe('SUCCESS');
    });

    it('should accept ERROR status', () => {
      const response: ResponseData = { status: 'ERROR', message: 'Failed' };
      expect(response.status).toBe('ERROR');
    });

    it('should accept ON_PROCESS status', () => {
      const response: ResponseData = { status: 'ON_PROCESS' };
      expect(response.status).toBe('ON_PROCESS');
    });

    it('should accept null status', () => {
      const response: ResponseData = { status: null };
      expect(response.status).toBeNull();
    });

    it('should accept all properties together', () => {
      const response: ResponseData = {
        status: 'SUCCESS',
        message: 'Operation completed',
        data: { id: 1, result: 'test' },
      };
      expect(response.status).toBe('SUCCESS');
      expect(response.message).toBe('Operation completed');
      expect(response.data).toEqual({ id: 1, result: 'test' });
    });

    it('should accept status only without optional properties', () => {
      const response: ResponseData = { status: 'ERROR' };
      expect(response.status).toBe('ERROR');
      expect(response.message).toBeUndefined();
      expect(response.data).toBeUndefined();
    });
  });

  describe('ValidatorType', () => {
    it('should accept required', () => {
      const validator: ValidatorType = 'required';
      expect(validator).toBe('required');
    });

    it('should accept email', () => {
      const validator: ValidatorType = 'email';
      expect(validator).toBe('email');
    });

    it('should accept minLength with number', () => {
      const validator: ValidatorType = 'minLength:5';
      expect(validator).toBe('minLength:5');
    });

    it('should accept maxLength with number', () => {
      const validator: ValidatorType = 'maxLength:100';
      expect(validator).toBe('maxLength:100');
    });

    it('should accept pattern with regex string', () => {
      const validator: ValidatorType = 'pattern:^[a-z]+$';
      expect(validator).toBe('pattern:^[a-z]+$');
    });

    it('should handle complex pattern', () => {
      const validator: ValidatorType = 'pattern:[A-Z]{2}\\d{4}';
      expect(validator).toBe('pattern:[A-Z]{2}\\d{4}');
    });
  });
});
