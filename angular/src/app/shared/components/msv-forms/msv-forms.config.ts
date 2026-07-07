import { InjectionToken, Provider } from '@angular/core';

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
  type:
    | 'required'
    | 'email'
    | 'minLength'
    | 'maxLength'
    | 'pattern'
    | 'min'
    | 'max'
    | 'custom';
  value?: number | string;
  message?: string;
  fn?: CustomValidatorFn;
}

/**
 * Configuration interface for MSV Forms
 */
export interface MsvFormsConfig {
  /**
   * Validation error messages
   */
  validationMessages: {
    required: string;
    email: string;
    minLength: (min: number) => string;
    maxLength: (max: number) => string;
    pattern: string;
    min: (min: number) => string;
    max: (max: number) => string;
  };

  /**
   * Loading text displayed during async operations
   */
  loadingText: string;
}

/**
 * Default MSV Forms configuration with Indonesian messages
 * Matches the current hardcoded messages in msv-input.component.ts
 */
export const DEFAULT_MSV_FORMS_CONFIG: MsvFormsConfig = {
  validationMessages: {
    required: 'Field ini wajib diisi',
    email: 'Format email tidak valid',
    minLength: (min: number) => `Minimal ${min} karakter`,
    maxLength: (max: number) => `Maksimal ${max} karakter`,
    pattern: 'Format tidak valid',
    min: (min: number) => `Nilai minimal ${min}`,
    max: (max: number) => `Nilai maksimal ${max}`,
  },
  loadingText: 'Processing...',
};

/**
 * Injection token for MSV Forms configuration
 * Uses providedIn: 'root' with factory to provide default config
 */
export const MSV_FORMS_CONFIG = new InjectionToken<MsvFormsConfig>(
  'msv-forms-config',
  {
    providedIn: 'root',
    factory: () => DEFAULT_MSV_FORMS_CONFIG,
  },
);

/**
 * Helper function to provide custom MSV Forms configuration
 * Merges custom config with defaults
 *
 * @param config Partial configuration to override defaults
 * @returns Provider for use in module or component providers array
 *
 * @example
 * ```typescript
 * // In app.config.ts or module providers
 * providers: [
 *   provideMsvFormsConfig({
 *     validationMessages: {
 *       required: 'This field is required',
 *       email: 'Invalid email format',
 *       minLength: (min) => `Minimum ${min} characters`,
 *       maxLength: (max) => `Maximum ${max} characters`,
 *       pattern: 'Invalid format'
 *     },
 *     loadingText: 'Loading...'
 *   })
 * ]
 * ```
 */
export function provideMsvFormsConfig(
  config: Partial<MsvFormsConfig>,
): Provider {
  return {
    provide: MSV_FORMS_CONFIG,
    useValue: { ...DEFAULT_MSV_FORMS_CONFIG, ...config },
  };
}
