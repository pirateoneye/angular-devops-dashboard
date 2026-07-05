import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MsvToastService } from './msv-toast.service';

describe('MsvToastService', () => {
  let service: MsvToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MsvToastService);
  });

  afterEach(() => {
    service.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Toast Creation', () => {
    it('should create success toast', (done) => {
      service.getToasts().subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].type).toBe('success');
          expect(toasts[0].message).toBe('Success message');
          expect(toasts[0].title).toBe('Success');
          done();
        }
      });

      service.success('Success message', 'Success');
    });

    it('should create error toast', (done) => {
      service.getToasts().subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].type).toBe('error');
          expect(toasts[0].message).toBe('Error message');
          expect(toasts[0].title).toBe('Error');
          done();
        }
      });

      service.error('Error message', 'Error');
    });

    it('should create warning toast', (done) => {
      service.getToasts().subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].type).toBe('warning');
          expect(toasts[0].message).toBe('Warning message');
          expect(toasts[0].title).toBe('Warning');
          done();
        }
      });

      service.warning('Warning message', 'Warning');
    });

    it('should create info toast', (done) => {
      service.getToasts().subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].type).toBe('info');
          expect(toasts[0].message).toBe('Info message');
          expect(toasts[0].title).toBe('Info');
          done();
        }
      });

      service.info('Info message', 'Info');
    });

    it('should create toast without title', (done) => {
      service.getToasts().subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].title).toBeUndefined();
          expect(toasts[0].message).toBe('Message only');
          done();
        }
      });

      service.success('Message only');
    });

    it('should assign unique IDs to toasts', (done) => {
      const ids = new Set<string>();

      service.getToasts().subscribe((toasts) => {
        if (toasts.length === 3) {
          toasts.forEach((toast) => ids.add(toast.id));
          expect(ids.size).toBe(3);
          done();
        }
      });

      service.info('Toast 1');
      service.success('Toast 2');
      service.error('Toast 3');
    });
  });

  describe('Toast Auto-Dismiss', () => {
    it('should auto-dismiss toast after default duration', fakeAsync(() => {
      let toastCount = 0;

      service.getToasts().subscribe((toasts) => {
        toastCount = toasts.length;
      });

      service.info('Auto dismiss test');
      tick(100);
      expect(toastCount).toBe(1);

      tick(5000); // Default duration
      expect(toastCount).toBe(0);
    }));

    it('should auto-dismiss toast after custom duration', fakeAsync(() => {
      let toastCount = 0;

      service.getToasts().subscribe((toasts) => {
        toastCount = toasts.length;
      });

      service.info('Custom duration', undefined, { duration: 2000 });
      tick(100);
      expect(toastCount).toBe(1);

      tick(2000);
      expect(toastCount).toBe(0);
    }));

    it('should not auto-dismiss when duration is 0', fakeAsync(() => {
      let toastCount = 0;

      service.getToasts().subscribe((toasts) => {
        toastCount = toasts.length;
      });

      service.info('Persistent toast', undefined, { duration: 0 });
      tick(100);
      expect(toastCount).toBe(1);

      tick(10000);
      expect(toastCount).toBe(1);
    }));
  });

  describe('Toast Management', () => {
    it('should manually dismiss toast by ID', (done) => {
      let toastId: string;
      let doneCalled = false;

      service.getToasts().subscribe((toasts) => {
        if (toasts.length === 1) {
          toastId = toasts[0].id;
          service.dismiss(toastId);
        } else if (toasts.length === 0 && toastId && !doneCalled) {
          doneCalled = true;
          expect(true).toBe(true);
          done();
        }
      });

      service.info('Dismiss me', undefined, { duration: 0 });
    });

    it('should handle multiple toasts correctly', (done) => {
      let maxCount = 0;

      service.getToasts().subscribe((toasts) => {
        if (toasts.length > maxCount) {
          maxCount = toasts.length;
        }
        if (maxCount === 3 && toasts.length === 3) {
          expect(toasts.length).toBe(3);
          expect(toasts[0].type).toBe('success');
          expect(toasts[1].type).toBe('warning');
          expect(toasts[2].type).toBe('error');
          done();
        }
      });

      service.success('First', undefined, { duration: 0 });
      service.warning('Second', undefined, { duration: 0 });
      service.error('Third', undefined, { duration: 0 });
    });

    it('should clear all toasts', (done) => {
      let doneCalled = false;

      service.getToasts().subscribe((toasts) => {
        if (toasts.length === 3) {
          service.clear();
        } else if (toasts.length === 0 && !doneCalled) {
          doneCalled = true;
          expect(toasts.length).toBe(0);
          done();
        }
      });

      service.info('Toast 1', undefined, { duration: 0 });
      service.success('Toast 2', undefined, { duration: 0 });
      service.error('Toast 3', undefined, { duration: 0 });
    });

    it('should handle dismissing non-existent toast gracefully', () => {
      service.dismiss('non-existent-id');
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should update default duration via configure', fakeAsync(() => {
      service.configure({ duration: 3000 });
      let toastCount = 0;

      service.getToasts().subscribe((toasts) => {
        toastCount = toasts.length;
      });

      service.info('Custom default duration');
      tick(100);
      expect(toastCount).toBe(1);

      tick(3000);
      expect(toastCount).toBe(0);
    }));

    it('should update default position via configure', (done) => {
      service.configure({ position: 'bottom-left' });

      expect(service.position).toBe('bottom-left');

      service.getToasts().subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(service.position).toBe('bottom-left');
          done();
        }
      });

      service.info('Position test');
    });

    it('should allow position override per toast', (done) => {
      service.configure({ position: 'top-right' });

      service.getToasts().subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(service.position).toBe('bottom-right');
          done();
        }
      });

      service.info('Override position', undefined, {
        position: 'bottom-right',
      });
    });
  });

  describe('Toast Properties', () => {
    it('should include timestamp in toast', (done) => {
      const beforeTime = Date.now();

      service.getToasts().subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
          expect(toasts[0].timestamp).toBeLessThanOrEqual(Date.now());
          done();
        }
      });

      service.info('Timestamp test');
    });

    it('should maintain correct duration in toast object', (done) => {
      service.getToasts().subscribe((toasts) => {
        if (toasts.length > 0) {
          expect(toasts[0].duration).toBe(3000);
          done();
        }
      });

      service.info('Duration test', undefined, { duration: 3000 });
    });
  });
});
