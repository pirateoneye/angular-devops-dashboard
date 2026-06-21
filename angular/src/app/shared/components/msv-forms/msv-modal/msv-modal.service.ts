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

    // Clean up when modal closes
    modalRef.afterClosed$.subscribe(() => {
      this.appRef.detachView(contentComponentRef.hostView);
      this.appRef.detachView(modalComponentRef.hostView);
      contentComponentRef.destroy();
      modalComponentRef.destroy();
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

    // Clean up on close
    modalRef.afterClosed$.subscribe(() => {
      this.appRef.detachView(modalComponentRef.hostView);
      modalComponentRef.destroy();
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
   * Creates the HTML content for confirmation dialog
   */
  private createConfirmationContent(
    title: string,
    message: string,
    modalRef: MsvModalRef<any, boolean>
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'msv-confirm-dialog';
    
    container.innerHTML = `
      <div class="msv-confirm-title">${title}</div>
      <div class="msv-confirm-message">${message}</div>
      <div class="msv-confirm-actions">
        <button class="msv-confirm-cancel" type="button">Tidak</button>
        <button class="msv-confirm-ok" type="button">Iya</button>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .msv-confirm-dialog {
        font-family: 'Open Sans', sans-serif;
      }
      .msv-confirm-title {
        font-size: 20px;
        font-weight: 700;
        color: #144E83;
        margin-bottom: 16px;
      }
      .msv-confirm-message {
        font-size: 14px;
        color: #2d3748;
        line-height: 1.6;
        margin-bottom: 24px;
      }
      .msv-confirm-actions {
        display: flex;
        gap: 0;
        border-top: 1px solid #c3c3c3;
        margin-top: 24px;
        padding-top: 0;
      }
      .msv-confirm-cancel,
      .msv-confirm-ok {
        flex: 1;
        height: 40px;
        font-family: 'Open Sans', sans-serif;
        font-weight: 700;
        outline: none;
        border: none;
        background-color: white;
        color: rgb(65, 65, 65);
        cursor: pointer;
        transition: all 0.3s;
      }
      .msv-confirm-cancel {
        border-radius: 0 0 0 5px;
      }
      .msv-confirm-cancel:hover {
        color: white;
        background-color: #aa0039;
      }
      .msv-confirm-ok {
        border-radius: 0 0 5px 0;
        border-left: 1px solid #c3c3c3;
      }
      .msv-confirm-ok:hover {
        color: white;
        background-color: #005CAA;
      }
    `;
    container.appendChild(style);

    // Add event listeners
    const cancelBtn = container.querySelector('.msv-confirm-cancel') as HTMLButtonElement;
    const okBtn = container.querySelector('.msv-confirm-ok') as HTMLButtonElement;

    cancelBtn?.addEventListener('click', () => modalRef.close(false));
    okBtn?.addEventListener('click', () => modalRef.close(true));

    return container;
  }
}
