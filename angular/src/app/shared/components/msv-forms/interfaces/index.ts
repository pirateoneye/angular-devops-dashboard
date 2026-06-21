/**
 * Shared interfaces and types for MSV Forms components
 */

/**
 * Represents an option in a select/dropdown component
 */
export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

/**
 * Standardized response data structure for form operations
 */
export interface ResponseData {
  status: 'SUCCESS' | 'ERROR' | 'ON_PROCESS' | null;
  message?: string;
  data?: any;
}

/**
 * Custom validator function type
 * Returns error message string if validation fails, null if validation passes
 */
export type CustomValidatorFn = (value: any) => string | null;

/**
 * Object-based validator configuration
 * Allows for more flexible validator definitions with custom messages and values
 */
export interface ValidatorConfig {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'custom';
  value?: number | string;
  message?: string;
  fn?: CustomValidatorFn;
}

/**
 * Supported validator types for form validation
 * Can be either:
 * - String-based: 'required', 'email', 'minLength:N', 'maxLength:N', 'pattern:REGEX', 'min:N', 'max:N'
 * - Object-based: ValidatorConfig with type, value, message, and optional custom function
 * 
 * String format (backward compatible):
 * - required: Field must have a value
 * - email: Field must be a valid email
 * - minLength:N: Field must have minimum N characters
 * - maxLength:N: Field must have maximum N characters
 * - pattern:REGEX: Field must match the regex pattern
 * - min:N: Field value must be >= N (for numbers)
 * - max:N: Field value must be <= N (for numbers)
 * 
 * Object format (enhanced):
 * - Allows custom error messages per validator
 * - Supports custom validation functions
 */
export type ValidatorType =
  | 'required'
  | 'email'
  | `minLength:${number}`
  | `maxLength:${number}`
  | `pattern:${string}`
  | `min:${number}`
  | `max:${number}`
  | ValidatorConfig;
