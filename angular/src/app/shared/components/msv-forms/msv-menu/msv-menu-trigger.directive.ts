import { 
  Directive, 
  Input, 
  HostListener, 
  ViewContainerRef,
  ElementRef,
  OnDestroy,
  TemplateRef
} from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { MsvMenuComponent } from './msv-menu.component';

@Directive({
  selector: '[msvMenuTriggerFor]'
})
export class MsvMenuTriggerDirective implements OnDestroy {
  @Input() msvMenuTriggerFor!: MsvMenuComponent;
  
  private overlayRef: OverlayRef | null = null;

  constructor(
    private overlay: Overlay,
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef
  ) {}

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.toggleMenu();
  }

  private toggleMenu(): void {
    if (this.overlayRef && this.overlayRef.hasAttached()) {
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

    // Create overlay if it doesn't exist
    if (!this.overlayRef) {
      this.overlayRef = this.createOverlay();
    }

    // Attach the menu element directly to overlay
    if (!this.overlayRef.hasAttached()) {
      const menuElement = (this.msvMenuTriggerFor as any).elementRef?.nativeElement;
      if (menuElement) {
        // Clone the menu element and attach it to the overlay
        const clonedElement = menuElement.cloneNode(true) as HTMLElement;
        const overlayPane = this.overlayRef.overlayElement;
        overlayPane.appendChild(clonedElement);
      }
      
      // Focus first item after menu opens
      setTimeout(() => {
        this.msvMenuTriggerFor.focusFirstEnabledItem();
      }, 0);

      // Set up outside click and escape key handlers
      this.setupCloseHandlers();
    }
  }

  closeMenu(): void {
    if (this.overlayRef && this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }
  }

  private createOverlay(): OverlayRef {
    const positions: ConnectedPosition[] = [
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
        offsetY: 4
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
        offsetY: -4
      },
      {
        originX: 'end',
        originY: 'bottom',
        overlayX: 'end',
        overlayY: 'top',
        offsetY: 4
      },
      {
        originX: 'end',
        originY: 'top',
        overlayX: 'end',
        overlayY: 'bottom',
        offsetY: -4
      }
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
      backdropClass: 'cdk-overlay-transparent-backdrop'
    });
  }

  private setupCloseHandlers(): void {
    if (!this.overlayRef) return;

    // Close on backdrop click (outside click)
    this.overlayRef.backdropClick().subscribe(() => {
      this.closeMenu();
    });

    // Close on escape key
    this.overlayRef.keydownEvents().subscribe((event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeMenu();
        // Return focus to trigger element
        this.elementRef.nativeElement.focus();
      }
    });

    // Close when menu item is clicked
    const menuItems = this.msvMenuTriggerFor.menuItems;
    if (menuItems) {
      menuItems.forEach(item => {
        const subscription = item.triggered.subscribe(() => {
          this.closeMenu();
        });
        // Store subscription for cleanup
        this.overlayRef?.detachments().subscribe(() => {
          subscription.unsubscribe();
        });
      });
    }
  }

  ngOnDestroy(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
}
