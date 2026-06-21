import { OverlayRef } from '@angular/cdk/overlay';
import { Subject } from 'rxjs';

/**
 * Reference to a modal opened via MsvModalService.
 * Provides methods to control and interact with the modal.
 */
export class MsvModalRef<T = any, R = any> {
  private readonly _afterClosed = new Subject<R | undefined>();

  /** Observable that emits when the modal is closed */
  readonly afterClosed$ = this._afterClosed.asObservable();

  constructor(
    private overlayRef: OverlayRef,
    public componentInstance: T
  ) {}

  /**
   * Close the modal and optionally return a result
   */
  close(result?: R): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this._afterClosed.next(result);
      this._afterClosed.complete();
    }
  }

  /**
   * Get the overlay backdrop element
   */
  getBackdropElement(): HTMLElement | null {
    return this.overlayRef.backdropElement;
  }
}
