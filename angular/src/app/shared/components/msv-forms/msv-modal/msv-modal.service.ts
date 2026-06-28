import { Injectable, Injector, ComponentRef, Type, ApplicationRef, createComponent } from '@angular/core';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Observable } from 'rxjs';
import { MsvModalComponent } from './msv-modal.component';
import { MsvModalConfig } from './msv-modal.types';
import { MsvModalRef } from './msv-modal-ref';

/**
 * Service for opening and managing modals.
 * Uses Angular CDK Overlay for rendering modals.
 */
@Injectable({
  providedIn: 'root'
})
export class MsvModalService {
  /**
   * Stack of currently open modals, ordered from oldest to newest.
   * Used to determine which modal is topmost (for Escape-key handling).
   */
  private static openStack: MsvModalRef<any, any>[] = [];

  /**
   * Returns true if the given modalRef is the topmost open modal.
   * Used by MsvModalComponent to ensure only the topmost modal closes on Escape.
   */
  static isTopmost(modalRef: MsvModalRef<any, any> | undefined): boolean {
    if (!modalRef) {
      return true;
    }
    const stack = MsvModalService.openStack;
    return stack.length === 0 || stack[stack.length - 1] === modalRef;
  }

  private pushOpen(modalRef: MsvModalRef<any, any>): void {
    MsvModalService.openStack.push(modalRef);
  }

  private popOpen(modalRef: MsvModalRef<any, any>): void {
    const stack = MsvModalService.openStack;
    const idx = stack.lastIndexOf(modalRef);
    if (idx !== -1) {
      stack.splice(idx, 1);
    }
  }

  constructor(
    private overlay: Overlay,
    private injector: Injector,
    private appRef: ApplicationRef
  ) {}

  /**
   * Opens a modal with the specified component
   * @param component Component to display in the modal
   * @param config Modal configuration
   * @returns MsvModalRef for controlling the modal
   */
  open<T, R = any>(component: Type<T>, config?: MsvModalConfig): MsvModalRef<T, R> {
    const defaultConfig: MsvModalConfig = {
      closable: true,
      size: 'medium',
      hasBackdrop: true,
      ...config
    };

    // Create overlay with backdrop
    const overlayRef = this.overlay.create(this.getOverlayConfig(defaultConfig));

    // Create modal wrapper component
    const modalComponentRef = createComponent(MsvModalComponent, {
      environmentInjector: this.appRef.injector,
      elementInjector: this.injector
    });

    // Create the user's content component
    const contentComponentRef = createComponent(component, {
      environmentInjector: this.appRef.injector,
      elementInjector: this.injector
    });

    // Create modal reference
    const modalRef = new MsvModalRef<T, R>(overlayRef, contentComponentRef.instance);

    // Configure modal component
    modalComponentRef.instance.closable = defaultConfig.closable ?? true;
    modalComponentRef.instance.size = defaultConfig.size ?? 'medium';
    modalComponentRef.instance.modalRef = modalRef;

    // Attach content to modal body if modalContent exists
    this.appRef.attachView(modalComponentRef.hostView);
    this.appRef.attachView(contentComponentRef.hostView);

    // Get the modal content container and append the content component
    const modalElement = modalComponentRef.location.nativeElement;
    const contentElement = contentComponentRef.location.nativeElement;
    
    // Find the modal body and append content
    const modalBody = modalElement.querySelector('.msv-modal-body');
    if (modalBody) {
      modalBody.appendChild(contentElement);
    }

    // Attach modal to overlay
    overlayRef.hostElement.appendChild(modalElement);

    // Track this modal on the open stack (for topmost Escape-key handling)
    this.pushOpen(modalRef);

    // Clean up when modal closes
    modalRef.afterClosed$.subscribe(() => {
      try {
        this.appRef.detachView(contentComponentRef.hostView);
        this.appRef.detachView(modalComponentRef.hostView);
        contentComponentRef.destroy();
        modalComponentRef.destroy();
      } finally {
        this.popOpen(modalRef);
        overlayRef.dispose();
      }
    });

    return modalRef;
  }

  /**
   * Opens a confirmation dialog with Yes/No buttons
   * @param title Dialog title
   * @param message Dialog message
   * @returns Observable that emits true if confirmed, false if cancelled
   */
  confirm(title: string, message: string): Observable<boolean> {
    const overlayRef = this.overlay.create(this.getOverlayConfig({
      closable: true,
      size: 'small',
      hasBackdrop: true
    }));

    // Create confirmation modal using MsvModalComponent
    const modalComponentRef = createComponent(MsvModalComponent, {
      environmentInjector: this.appRef.injector,
      elementInjector: this.injector
    });

    const modalRef = new MsvModalRef<MsvModalComponent, boolean>(
      overlayRef,
      modalComponentRef.instance
    );

    // Configure modal
    modalComponentRef.instance.closable = true;
    modalComponentRef.instance.size = 'small';
    modalComponentRef.instance.modalRef = modalRef;

    // Attach modal to app
    this.appRef.attachView(modalComponentRef.hostView);
    const modalElement = modalComponentRef.location.nativeElement;

    // Create confirmation content
    const confirmContent = this.createConfirmationContent(title, message, modalRef);
    const modalBody = modalElement.querySelector('.msv-modal-body');
    if (modalBody) {
      modalBody.innerHTML = '';
      modalBody.appendChild(confirmContent);
    }

    // Attach to overlay
    overlayRef.hostElement.appendChild(modalElement);

    // Track this modal on the open stack (for topmost Escape-key handling)
    this.pushOpen(modalRef);

    // Clean up on close — ensure overlay is disposed on every close path
    modalRef.afterClosed$.subscribe(() => {
      try {
        this.appRef.detachView(modalComponentRef.hostView);
        modalComponentRef.destroy();
      } finally {
        this.popOpen(modalRef);
        overlayRef.dispose();
      }
    });

    // Return observable that emits the result
    return new Observable<boolean>(observer => {
      modalRef.afterClosed$.subscribe(result => {
        observer.next(result ?? false);
        observer.complete();
      });
    });
  }

  /**
   * Creates the overlay configuration
   */
  private getOverlayConfig(config: MsvModalConfig): OverlayConfig {
    return {
      hasBackdrop: config.hasBackdrop ?? true,
      backdropClass: config.backdropClass || '',
      panelClass: config.panelClass || '',
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block()
    };
  }

  /**
   * Creates the HTML content for confirmation dialog.
   * Builds the DOM with createElement + textContent (no innerHTML interpolation)
   * so caller-supplied title/message are treated as plain text, preventing XSS.
   * The visual styling lives in MsvModalComponent's encapsulated styles and is
   * applied via CSS variables (var(--msv-primary-color) etc.).
   */
  private createConfirmationContent(
    title: string,
    message: string,
    modalRef: MsvModalRef<any, boolean>
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'msv-confirm-dialog';

    const titleEl = document.createElement('div');
    titleEl.className = 'msv-confirm-title';
    titleEl.textContent = title;

    const messageEl = document.createElement('div');
    messageEl.className = 'msv-confirm-message';
    messageEl.textContent = message;

    const actionsEl = document.createElement('div');
    actionsEl.className = 'msv-confirm-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'msv-confirm-cancel';
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Tidak';

    const okBtn = document.createElement('button');
    okBtn.className = 'msv-confirm-ok';
    okBtn.type = 'button';
    okBtn.textContent = 'Iya';

    actionsEl.appendChild(cancelBtn);
    actionsEl.appendChild(okBtn);
    container.appendChild(titleEl);
    container.appendChild(messageEl);
    container.appendChild(actionsEl);

    // Add event listeners
    cancelBtn.addEventListener('click', () => modalRef.close(false));
    okBtn.addEventListener('click', () => modalRef.close(true));

    return container;
  }
}
