// ponytail: these types are defined here as the single source; 12 consumers import them
import { ValidatorConfig, CustomValidatorFn } from '../msv-forms.config';

/** DSL string ('required', 'email', 'minLength:5') or object config */
export type ValidatorType = string | ValidatorConfig;

export { ValidatorConfig, CustomValidatorFn };

export interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

export interface ResponseData {
  status: 'SUCCESS' | 'ERROR' | 'ON_PROCESS' | null;
  message?: string;
  data?: any;
}
