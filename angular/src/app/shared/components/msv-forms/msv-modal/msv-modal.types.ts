import { ComponentRef } from '@angular/core';

/**
 * Modal size variants
 */
export type MsvModalSize = 'small' | 'medium' | 'large';

/**
 * Configuration for opening a modal
 */
export interface MsvModalConfig<D = any> {
  /** Data to pass to the modal component */
  data?: D;
  
  /** Whether the modal can be closed by clicking backdrop or pressing escape */
  closable?: boolean;
  
  /** Size of the modal */
  size?: MsvModalSize;
  
  /** Custom CSS classes to apply to the modal container */
  panelClass?: string | string[];
  
  /** Whether to show backdrop */
  hasBackdrop?: boolean;
  
  /** Custom backdrop CSS classes */
  backdropClass?: string | string[];
}

/**
 * Internal interface for modal container
 */
export interface MsvModalContainer {
  attachComponentPortal<T>(componentRef: ComponentRef<T>): void;
}
