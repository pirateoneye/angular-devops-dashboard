import { Component, Input, HostListener, ElementRef, ViewChild, ViewContainerRef } from '@angular/core';
import { MsvModalSize } from './msv-modal.types';
import { MsvModalRef } from './msv-modal-ref';
import { MsvModalService } from './msv-modal.service';

@Component({
  selector: 'msv-modal',
  template: `
<div class="msv-modal-backdrop" (click)="onBackdropClick($event)">
  <div class="msv-modal-container" [ngClass]="getSizeClass()" (click)="$event.stopPropagation()">
    <!-- Header Slot -->
    <div class="msv-modal-header">
      <ng-content select="[msvModalHeader]"></ng-content>
      <button 
        *ngIf="closable" 
        class="msv-modal-close" 
        (click)="close()"
        type="button"
        aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- Body Slot (default content) -->
    <div class="msv-modal-body">
      <ng-content></ng-content>
      <ng-container #modalContent></ng-container>
    </div>

    <!-- Footer Slot -->
    <div class="msv-modal-footer">
      <ng-content select="[msvModalFooter]"></ng-content>
    </div>
  </div>
</div>
  `,
  styles: [`
/* CSS Variables */
:host {
  --msv-primary-color: #144e83;
  --msv-error-color: #dc3545;
  --msv-success-color: #28a745;
  --msv-warning-color: #ffc107;
  --msv-border-color: #ced4da;
  --msv-focus-color: #005caa;
  --msv-font-family: 'Open Sans', sans-serif;
  --msv-border-radius: 5px;
  --msv-input-height: 45px;
  --msv-input-padding: 5px 10px;
}

/* Backdrop - full viewport overlay */
.msv-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(20, 78, 131, 0.85) 0%,
    rgba(0, 92, 170, 0.75) 50%,
    rgba(20, 78, 131, 0.85) 100%
  );
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: backdropFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 20px;
}

@keyframes backdropFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Modal Container */
.msv-modal-container {
  background: white;
  border-radius: var(--msv-border-radius);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);
  position: relative;
  animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  font-family: var(--msv-font-family);
  overflow: hidden;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Size Variants */
.msv-modal-small {
  width: 100%;
  max-width: 400px;
}

.msv-modal-medium {
  width: 100%;
  max-width: 600px;
}

.msv-modal-large {
  width: 100%;
  max-width: 900px;
}

/* Header */
.msv-modal-header {
  position: relative;
  padding: 24px 28px 20px;
  border-bottom: 2px solid #e8edf2;
  background: linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%);
  flex-shrink: 0;
}

.msv-modal-header:empty {
  display: none;
}

/* Close Button */
.msv-modal-close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(20, 78, 131, 0.06);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--msv-primary-color);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.msv-modal-close:hover {
  background: var(--msv-primary-color);
  color: white;
  transform: rotate(90deg);
}

.msv-modal-close:active {
  transform: rotate(90deg) scale(0.95);
}

/* Body */
.msv-modal-body {
  padding: 28px;
  overflow-y: auto;
  flex: 1;
  color: #2d3748;
  line-height: 1.6;
}

.msv-modal-body:empty {
  display: none;
}

/* Custom scrollbar */
.msv-modal-body::-webkit-scrollbar {
  width: 8px;
}

.msv-modal-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.msv-modal-body::-webkit-scrollbar-thumb {
  background: var(--msv-primary-color);
  border-radius: 4px;
  opacity: 0.5;
}

.msv-modal-body::-webkit-scrollbar-thumb:hover {
  background: var(--msv-focus-color);
}

/* Footer */
.msv-modal-footer {
  padding: 20px 28px 24px;
  border-top: 2px solid #e8edf2;
  background: linear-gradient(to top, #ffffff 0%, #fafbfc 100%);
  flex-shrink: 0;
}

.msv-modal-footer:empty {
  display: none;
}

/* Confirmation dialog — built dynamically by MsvModalService.confirm()
   and appended into .msv-modal-body. ::ng-deep is required because the
   confirm nodes are inserted via DOM APIs (not rendered by Angular), so
   they do not receive this component's emulated-encapsulation scoping
   attributes. Colors use the CSS vars declared on :host above. */
.msv-modal-body ::ng-deep .msv-confirm-dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: var(--msv-font-family);
}

.msv-modal-body ::ng-deep .msv-confirm-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--msv-primary-color);
  line-height: 1.4;
}

.msv-modal-body ::ng-deep .msv-confirm-message {
  font-size: 14px;
  color: #2d3748;
  line-height: 1.6;
}

.msv-modal-body ::ng-deep .msv-confirm-actions {
  display: flex;
  flex-direction: row;
  gap: 10px;
  margin-top: 4px;
}

.msv-modal-body ::ng-deep .msv-confirm-cancel,
.msv-modal-body ::ng-deep .msv-confirm-ok {
  flex: 1;
  height: 40px;
  border-radius: 20px;
  font-family: var(--msv-font-family);
  font-weight: 700;
  cursor: pointer;
  border: 1px solid var(--msv-border-color);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.msv-modal-body ::ng-deep .msv-confirm-cancel {
  background: #fff;
  color: var(--msv-primary-color);
}

.msv-modal-body ::ng-deep .msv-confirm-cancel:hover {
  background: #f6f6f6;
}

.msv-modal-body ::ng-deep .msv-confirm-ok {
  background: var(--msv-focus-color);
  color: #fff;
  border-color: var(--msv-focus-color);
}

.msv-modal-body ::ng-deep .msv-confirm-ok:hover {
  background: var(--msv-primary-color);
  border-color: var(--msv-primary-color);
}

/* Responsive */
@media (max-width: 640px) {
  .msv-modal-backdrop {
    padding: 10px;
  }

  .msv-modal-small,
  .msv-modal-medium,
  .msv-modal-large {
    max-width: 100%;
  }

  .msv-modal-header,
  .msv-modal-body,
  .msv-modal-footer {
    padding-left: 20px;
    padding-right: 20px;
  }
}
  `]
})
export class MsvModalComponent {
  @Input() closable: boolean = true;
  @Input() size: MsvModalSize = 'medium';
  @Input() modalRef?: MsvModalRef;

  @ViewChild('modalContent', { read: ViewContainerRef }) modalContent?: ViewContainerRef;

  constructor(private elementRef: ElementRef) {}

  onBackdropClick(event: MouseEvent): void {
    // Handler is bound to the .msv-modal-backdrop element in the template.
    // event.currentTarget is that backdrop element, so we close only when the
    // click lands directly on the backdrop — not on content bubbling up, which
    // is stopped by the container's (click)="$event.stopPropagation()".
    if (this.closable && event.target === event.currentTarget) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    // Only the topmost modal should close on Escape; otherwise a single Escape
    // press would dismiss every mounted modal at once.
    if (this.closable && MsvModalService.isTopmost(this.modalRef)) {
      event.preventDefault();
      this.close();
    }
  }

  close(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  getSizeClass(): string {
    return `msv-modal-${this.size}`;
  }
}
