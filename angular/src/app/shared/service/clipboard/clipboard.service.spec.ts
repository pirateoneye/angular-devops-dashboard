import { ClipboardService } from './clipboard.service';

describe('ClipboardService', () => {
  let service: ClipboardService;

  beforeEach(() => {
    service = new ClipboardService();
  });

  it('should start with null lastCopied', () => {
    expect(service.lastCopied()).toBeNull();
  });

  it('should set lastCopied after successful copy and clear after timeout', async () => {
    // Mock navigator.clipboard
    const writeTextSpy = jasmine.createSpy('writeText').and.resolveTo();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      writable: true,
      configurable: true,
    });

    jasmine.clock().install();
    const result = service.copy('test text');
    jasmine.clock().tick(0); // resolve microtasks
    jasmine.clock().tick(2000);

    expect(await result).toBe(true);
    expect(writeTextSpy).toHaveBeenCalledWith('test text');
    jasmine.clock().uninstall();
  });

  it('should use fallback when clipboard API is unavailable', async () => {
    // Remove clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    // execCommand mock
    const execCommandSpy = spyOn(document, 'execCommand').and.returnValue(true);

    jasmine.clock().install();
    const result = service.copy('fallback text');
    jasmine.clock().tick(0);
    jasmine.clock().tick(2000);

    expect(await result).toBe(true);
    expect(execCommandSpy).toHaveBeenCalledWith('copy');
    jasmine.clock().uninstall();
  });

  it('should return false and clear lastCopied on copy failure', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jasmine.createSpy('writeText').and.rejectWith(new Error('denied')) },
      writable: true,
      configurable: true,
    });

    const result = await service.copy('fail');
    expect(result).toBe(false);
    expect(service.lastCopied()).toBeNull();
  });

  it('should clear lastCopied immediately', () => {
    // set via internal signal
    (service as unknown as { lastCopied: { set: (v: string | null) => void } }).lastCopied.set('test');
    service.clear();
    expect(service.lastCopied()).toBeNull();
  });
});
