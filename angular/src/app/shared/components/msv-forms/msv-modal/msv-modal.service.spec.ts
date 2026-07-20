import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { MsvModalService } from './msv-modal.service';
import { MsvModalComponent } from './msv-modal.component';
import { CommonModule } from '@angular/common';

@Component({
  template: `<div class="test-component">Test Component Content</div>`,
})
class TestModalContentComponent {
  testData?: any;
}

describe('MsvModalService', () => {
  let service: MsvModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OverlayModule, CommonModule, MsvModalComponent],
      providers: [MsvModalService],
    });
    service = TestBed.inject(MsvModalService);
  });

  afterEach(() => {
    // Clean up any open overlays
    const overlayContainer = document.querySelector('.cdk-overlay-container');
    if (overlayContainer) {
      overlayContainer.innerHTML = '';
    }
    // Also clean up any remaining overlay backdrops
    document
      .querySelectorAll('.cdk-overlay-backdrop')
      .forEach((el) => el.remove());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open modal with component', () => {
    const modalRef = service.open(TestModalContentComponent);

    expect(modalRef).toBeTruthy();
    expect(modalRef.componentInstance).toBeInstanceOf(
      TestModalContentComponent,
    );

    modalRef.close();
  });

  it('should open modal with default configuration', () => {
    const modalRef = service.open(TestModalContentComponent);

    const overlayElement = document.querySelector('.cdk-overlay-pane');
    expect(overlayElement).toBeTruthy();

    modalRef.close();
  });

  it('should open modal with custom size', () => {
    const modalRef = service.open(TestModalContentComponent, { size: 'small' });
    expect(modalRef).toBeTruthy();
    modalRef.close();
  });

  it('should set closable to false when configured', () => {
    const modalRef = service.open(TestModalContentComponent, {
      closable: false,
    });
    expect(modalRef).toBeTruthy();
    modalRef.close();
  });

  it('should set closable to true when configured', () => {
    const modalRef = service.open(TestModalContentComponent, {
      closable: true,
    });
    expect(modalRef).toBeTruthy();
    modalRef.close();
  });

  it('should close modal when modalRef.close() is called', (done) => {
    const modalRef = service.open(TestModalContentComponent);

    modalRef.afterClosed$.subscribe(() => {
      const overlayElement = document.querySelector('.cdk-overlay-pane');
      // Overlay should be removed after close
      setTimeout(() => {
        expect(overlayElement?.parentElement).toBeFalsy();
        done();
      }, 100);
    });

    modalRef.close();
  });

  it('should emit result when modal is closed with value', (done) => {
    const modalRef = service.open<TestModalContentComponent, string>(
      TestModalContentComponent,
    );
    const testResult = 'test-result';

    modalRef.afterClosed$.subscribe((result) => {
      expect(result).toBe(testResult);
      done();
    });

    modalRef.close(testResult);
  });

  it('should open confirmation dialog', () => {
    const confirmObs = service.confirm('Test Title', 'Test Message');
    expect(confirmObs).toBeTruthy();

    // Clean up
    const overlayContainer = document.querySelector('.cdk-overlay-container');
    const cancelBtn = overlayContainer?.querySelector(
      '.msv-confirm-cancel',
    ) as HTMLButtonElement;
    cancelBtn?.click();
  });

  it('should return true when confirm dialog is accepted', (done) => {
    const confirmObs = service.confirm('Test Title', 'Test Message');

    confirmObs.subscribe((result) => {
      expect(result).toBe(true);
      done();
    });

    setTimeout(() => {
      const overlayContainer = document.querySelector('.cdk-overlay-container');
      const okBtn = overlayContainer?.querySelector(
        '.msv-confirm-ok',
      ) as HTMLButtonElement;
      okBtn?.click();
    }, 50);
  });

  it('should return false when confirm dialog is cancelled', (done) => {
    const confirmObs = service.confirm('Test Title', 'Test Message');

    confirmObs.subscribe((result) => {
      expect(result).toBe(false);
      done();
    });

    setTimeout(() => {
      const overlayContainer = document.querySelector('.cdk-overlay-container');
      const cancelBtn = overlayContainer?.querySelector(
        '.msv-confirm-cancel',
      ) as HTMLButtonElement;
      cancelBtn?.click();
    }, 50);
  });

  it('should create confirmation with correct button labels', (done) => {
    service.confirm('Test', 'Message');

    setTimeout(() => {
      const overlayContainer = document.querySelector('.cdk-overlay-container');
      const okBtn = overlayContainer?.querySelector(
        '.msv-confirm-ok',
      ) as HTMLButtonElement;
      const cancelBtn = overlayContainer?.querySelector(
        '.msv-confirm-cancel',
      ) as HTMLButtonElement;

      expect(okBtn?.textContent).toBe('Iya');
      expect(cancelBtn?.textContent).toBe('Tidak');

      cancelBtn?.click();
      done();
    }, 50);
  });

  it('should handle multiple modals', () => {
    const modalRef1 = service.open(TestModalContentComponent);
    const modalRef2 = service.open(TestModalContentComponent);

    expect(modalRef1).toBeTruthy();
    expect(modalRef2).toBeTruthy();
    expect(modalRef1).not.toBe(modalRef2);

    modalRef1.close();
    modalRef2.close();
  });

  it('should clean up component views when modal closes', (done) => {
    const modalRef = service.open(TestModalContentComponent);

    modalRef.afterClosed$.subscribe(() => {
      // Give time for cleanup
      setTimeout(() => {
        const overlayContainer = document.querySelector(
          '.cdk-overlay-container',
        );
        const testComponent =
          overlayContainer?.querySelector('.test-component');
        expect(testComponent).toBeFalsy();
        done();
      }, 100);
    });

    modalRef.close();
  });
});
