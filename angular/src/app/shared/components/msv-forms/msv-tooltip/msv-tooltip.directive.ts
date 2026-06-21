import {
  Directive,
  Input,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewContainerRef,
  ComponentRef,
  Component,
} from '@angular/core';
import {
  Overlay,
  OverlayRef,
  ConnectedPosition,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

@Component({
  selector: 'msv-tooltip-container',
  template: `<div class="msv-tooltip">{{ text }}</div>`,
  styles: [
    `
      .msv-tooltip {
        background-color: #333;
        color: white;
        padding: 8px 12px;
        border-radius: var(--msv-border-radius, 5px);
        font-family: var(--msv-font-family, 'Open Sans', sans-serif);
        font-size: 14px;
        max-width: 250px;
        word-wrap: break-word;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
    `,
  ],
  standalone: false,
})
export class MsvTooltipContainerComponent {
  text: string = '';
}

@Directive({
  selector: '[msvTooltip]',
  standalone: false,
})
export class MsvTooltipDirective implements OnDestroy {
  @Input() msvTooltip: string = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() tooltipDelay: number = 300;

  private overlayRef: OverlayRef | null = null;
  private tooltipComponent: ComponentRef<MsvTooltipContainerComponent> | null = null;
  private showTimeout: any = null;

  constructor(
    private overlay: Overlay,
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef
  ) {}

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!this.msvTooltip || this.msvTooltip.trim() === '') {
      return;
    }

    this.showTimeout = setTimeout(() => {
      this.show();
    }, this.tooltipDelay);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    this.hide();
  }

  private show(): void {
    if (this.overlayRef) {
      return;
    }

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions(this.getPositions());

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });

    const tooltipPortal = new ComponentPortal(
      MsvTooltipContainerComponent,
      this.viewContainerRef
    );
    this.tooltipComponent = this.overlayRef.attach(tooltipPortal);
    this.tooltipComponent.instance.text = this.msvTooltip;
  }

  private hide(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
      this.tooltipComponent = null;
    }
  }

  private getPositions(): ConnectedPosition[] {
    const positions: Record<string, ConnectedPosition> = {
      top: {
        originX: 'center',
        originY: 'top',
        overlayX: 'center',
        overlayY: 'bottom',
        offsetY: -8,
      },
      bottom: {
        originX: 'center',
        originY: 'bottom',
        overlayX: 'center',
        overlayY: 'top',
        offsetY: 8,
      },
      left: {
        originX: 'start',
        originY: 'center',
        overlayX: 'end',
        overlayY: 'center',
        offsetX: -8,
      },
      right: {
        originX: 'end',
        originY: 'center',
        overlayX: 'start',
        overlayY: 'center',
        offsetX: 8,
      },
    };

    return [positions[this.tooltipPosition]];
  }

  ngOnDestroy(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
    }
    this.hide();
  }
}
