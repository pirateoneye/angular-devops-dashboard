import { Injectable } from '@angular/core';
import { MsvFormsConfig } from './msv-forms.config';
import { ValidatorType, ValidatorConfig } from './interfaces';

/**
 * MsvValidatorHelper Service
 *
 * Centralized validation logic service for MSV Forms components.
 * Supports three validator formats:
 * 1. String DSL: 'required', 'email', 'minLength:N', 'maxLength:N', 'pattern:REGEX'
 * 2. Object config: { type: 'required', message: 'Custom message' }
 * 3. Custom functions: { type: 'custom', fn: (val) => string | null }
 *
 * @example
 * ```typescript
 * // String DSL validators
 * const errors1 = helper.runValidation('test', ['required', 'email'], config);
 *
 * // Object config with custom message
 * const errors2 = helper.runValidation('', [
 *   { type: 'required', message: 'This field is required!' }
 * ], config);
 *
 * // Custom validator
 * const errors3 = helper.runValidation('value', [
 *   { type: 'custom', fn: (val) => val === 'secret' ? null : 'Invalid!' }
 * ], config);
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class MsvValidatorHelper {
  /**
   * Run validation on a value against a list of validators
   *
   * @param value The value to validate
   * @param validators Array of validators (string DSL, object config, or custom functions)
   * @param config MsvFormsConfig containing default error messages
   * @returns Array of error messages (empty if all validations pass)
   */
  runValidation(
    value: any,
    validators: ValidatorType[],
    config: MsvFormsConfig,
  ): string[] {
    const errors: string[] = [];

    for (const validator of validators) {
      // Handle string-based validators (backward compatible)
      if (typeof validator === 'string') {
        const error = this.validateString(value, validator, config);
        if (error) {
          errors.push(error);
        }
      }
      // Handle object-based validators
      else {
        const error = this.validateObject(value, validator, config);
        if (error) {
          errors.push(error);
        }
      }
    }

    return errors;
  }

  /**
   * Validate using string DSL format
   * Replicates exact logic from msv-input.component.ts:85-117
   */
  private validateString(
    value: any,
    validator: string,
    config: MsvFormsConfig,
  ): string | null {
    // Required validator: line 92-93
    // Check for null, undefined, empty string, or empty array (but allow 0 and false as valid values)
    if (
      validator === 'required' &&
      (value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0))
    ) {
      return config.validationMessages.required;
    }

    // Email validator: line 95-99
    if (validator === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return config.validationMessages.email;
      }
    }

    // MinLength validator: line 101-105
    if (validator.startsWith('minLength:')) {
      const minLen = parseInt(validator.split(':')[1], 10);
      if (value && value.length < minLen) {
        return config.validationMessages.minLength(minLen);
      }
    }

    // MaxLength validator: line 107-111
    if (validator.startsWith('maxLength:')) {
      const maxLen = parseInt(validator.split(':')[1], 10);
      if (value && value.length > maxLen) {
        return config.validationMessages.maxLength(maxLen);
      }
    }

    // Pattern validator: line 113-118
    if (validator.startsWith('pattern:')) {
      const pattern = validator.substring(8);
      const regex = new RegExp(pattern);
      if (value && !regex.test(value)) {
        return config.validationMessages.pattern;
      }
    }

    // Min validator (for numbers)
    if (validator.startsWith('min:')) {
      const minVal = parseFloat(validator.split(':')[1]);
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (!isNaN(numValue) && numValue < minVal) {
        return config.validationMessages.min(minVal);
      }
    }

    // Max validator (for numbers)
    if (validator.startsWith('max:')) {
      const maxVal = parseFloat(validator.split(':')[1]);
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (!isNaN(numValue) && numValue > maxVal) {
        return config.validationMessages.max(maxVal);
      }
    }

    return null;
  }

  /**
   * Validate using object config format
   * Supports custom messages and custom validator functions
   */
  private validateObject(
    value: any,
    validator: ValidatorConfig,
    config: MsvFormsConfig,
  ): string | null {
    const { type, value: validatorValue, message, fn } = validator;

    // Custom validator
    if (type === 'custom' && fn) {
      return fn(value);
    }

    // Required validator
    // Check for null, undefined, empty string, or empty array (but allow 0 and false as valid values)
    if (
      type === 'required' &&
      (value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0))
    ) {
      return message || config.validationMessages.required;
    }

    // Email validator
    if (type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return message || config.validationMessages.email;
      }
    }

    // MinLength validator
    if (type === 'minLength' && validatorValue !== undefined) {
      const minLen =
        typeof validatorValue === 'number'
          ? validatorValue
          : parseInt(String(validatorValue), 10);
      if (value && value.length < minLen) {
        return message || config.validationMessages.minLength(minLen);
      }
    }

    // MaxLength validator
    if (type === 'maxLength' && validatorValue !== undefined) {
      const maxLen =
        typeof validatorValue === 'number'
          ? validatorValue
          : parseInt(String(validatorValue), 10);
      if (value && value.length > maxLen) {
        return message || config.validationMessages.maxLength(maxLen);
      }
    }

    // Pattern validator
    if (type === 'pattern' && validatorValue !== undefined) {
      const pattern = String(validatorValue);
      const regex = new RegExp(pattern);
      if (value && !regex.test(value)) {
        return message || config.validationMessages.pattern;
      }
    }

    // Min validator (for numbers)
    if (type === 'min' && validatorValue !== undefined) {
      const minVal =
        typeof validatorValue === 'number'
          ? validatorValue
          : parseFloat(String(validatorValue));
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (!isNaN(numValue) && numValue < minVal) {
        return message || config.validationMessages.min(minVal);
      }
    }

    // Max validator (for numbers)
    if (type === 'max' && validatorValue !== undefined) {
      const maxVal =
        typeof validatorValue === 'number'
          ? validatorValue
          : parseFloat(String(validatorValue));
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (!isNaN(numValue) && numValue > maxVal) {
        return message || config.validationMessages.max(maxVal);
      }
    }

    return null;
  }
}
