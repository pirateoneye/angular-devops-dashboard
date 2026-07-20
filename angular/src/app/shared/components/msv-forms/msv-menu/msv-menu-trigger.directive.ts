import {
  Directive,
  Input,
  HostListener,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { MsvMenuComponent } from './msv-menu.component';

@Directive({standalone: true, selector: '[msvMenuTriggerFor]',})
export class MsvMenuTriggerDirective implements OnDestroy {
  @Input() msvMenuTriggerFor!: MsvMenuComponent;

  private overlayRef: OverlayRef | null = null;
  private menuOpen = false;
  private clonedMenuElement: HTMLElement | null = null;

  constructor(
    private overlay: Overlay,
    private elementRef: ElementRef,
  ) {}

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.toggleMenu();
  }

  private toggleMenu(): void {
    if (this.menuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu(): void {
    if (!this.msvMenuTriggerFor) {
      console.error('msvMenuTriggerFor is not set');
      return;
    }

    // Already open — nothing to do.
    if (this.menuOpen) {
      return;
    }

    // Create overlay if it doesn't exist
    if (!this.overlayRef) {
      this.overlayRef = this.createOverlay();
    }

    // Attach the menu element directly to overlay (clone so the original stays in place)
    const menuElement = (this.msvMenuTriggerFor as any).elementRef
      ?.nativeElement;
    if (menuElement) {
      this.clonedMenuElement = menuElement.cloneNode(true) as HTMLElement;
      this.overlayRef.overlayElement.appendChild(this.clonedMenuElement);
    }

    this.menuOpen = true;

    // Focus first item after menu opens
    setTimeout(() => {
      this.msvMenuTriggerFor.focusFirstEnabledItem();
    }, 0);

    // Set up outside click and escape key handlers
    this.setupCloseHandlers();
  }

  closeMenu(): void {
    if (!this.menuOpen) {
      return;
    }

    // Remove the cloned menu element from the overlay pane
    if (this.clonedMenuElement && this.clonedMenuElement.parentNode) {
      this.clonedMenuElement.parentNode.removeChild(this.clonedMenuElement);
    }
    this.clonedMenuElement = null;

    if (this.overlayRef) {
      this.overlayRef.detach();
    }

    this.menuOpen = false;
  }

  private createOverlay(): OverlayRef {
    const positions: ConnectedPosition[] = [
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
        offsetY: 4,
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
        offsetY: -4,
      },
      {
        originX: 'end',
        originY: 'bottom',
        overlayX: 'end',
        overlayY: 'top',
        offsetY: 4,
      },
      {
        originX: 'end',
        originY: 'top',
        overlayX: 'end',
        overlayY: 'bottom',
        offsetY: -4,
      },
    ];

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions(positions)
      .withFlexibleDimensions(false)
      .withPush(false);

    return this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });
  }

  private setupCloseHandlers(): void {
    if (!this.overlayRef) return;

    // Close on backdrop click (outside click)
    this.overlayRef.backdropClick().subscribe({
      next: () => {
        this.closeMenu();
      },
    });

    // Close on escape key
    this.overlayRef.keydownEvents().subscribe({
      next: (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.closeMenu();
          // Return focus to trigger element
          this.elementRef.nativeElement.focus();
        }
      },
    });

    // Close when menu item is clicked
    const menuItems = this.msvMenuTriggerFor.menuItems;
    if (menuItems) {
      menuItems.forEach((item) => {
        const subscription = item.triggered.subscribe({
          next: () => {
            this.closeMenu();
          },
        });
        // Store subscription for cleanup
        this.overlayRef?.detachments().subscribe({
          next: () => {
            subscription.unsubscribe();
          },
        });
      });
    }
  }

  ngOnDestroy(): void {
    this.clonedMenuElement = null;
    this.menuOpen = false;
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
}
