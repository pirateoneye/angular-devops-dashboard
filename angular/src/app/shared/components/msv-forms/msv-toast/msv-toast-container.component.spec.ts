import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { MsvToastContainerComponent } from './msv-toast-container.component';
import { MsvToastComponent } from './msv-toast.component';
import { MsvToastService } from './msv-toast.service';

describe('MsvToastContainerComponent', () => {
  let component: MsvToastContainerComponent;
  let fixture: ComponentFixture<MsvToastContainerComponent>;
  let service: MsvToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvToastContainerComponent, MsvToastComponent],
      imports: [CommonModule],
      providers: [MsvToastService]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvToastContainerComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(MsvToastService);
    fixture.detectChanges();
  });

  afterEach(() => {
    service.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display toasts from service', fakeAsync(() => {
    service.info('Test toast', undefined, { duration: 0 });
    tick(100);
    fixture.detectChanges();

    expect(component.toasts.length).toBe(1);
    expect(component.toasts[0].message).toBe('Test toast');
    
    flush(); // Clear any remaining timers
  }));

  it('should display multiple toasts', fakeAsync(() => {
    service.success('Toast 1', undefined, { duration: 0 });
    service.error('Toast 2', undefined, { duration: 0 });
    service.warning('Toast 3', undefined, { duration: 0 });
    tick(100);
    fixture.detectChanges();

    expect(component.toasts.length).toBe(3);
    
    flush(); // Clear any remaining timers
  }));

  it('should remove toast when dismissed', fakeAsync(() => {
    service.info('Dismiss me', undefined, { duration: 0 });
    tick(100);
    fixture.detectChanges();

    const toastId = component.toasts[0].id;
    component.onDismiss(toastId);
    tick(100);
    fixture.detectChanges();

    expect(component.toasts.length).toBe(0);
  }));

  it('should update position from service', () => {
    service.configure({ position: 'bottom-left' });
    service.info('Test');
    fixture.detectChanges();

    expect(component.position).toBe('bottom-left');
  });

  it('should apply correct position class', () => {
    service.configure({ position: 'top-left' });
    service.info('Test');
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.toast-container');
    expect(container.classList.contains('toast-position-top-left')).toBe(true);
  });

  it('should render toast components for each toast', fakeAsync(() => {
    service.success('Success');
    service.error('Error');
    tick(100);
    fixture.detectChanges();

    const toastElements = fixture.nativeElement.querySelectorAll('msv-toast');
    expect(toastElements.length).toBe(2);
    
    flush(); // Clear any remaining timers
  }));

  it('should unsubscribe on destroy', () => {
    const subscription = component['subscription'];
    spyOn(subscription!, 'unsubscribe');
    
    component.ngOnDestroy();
    
    expect(subscription!.unsubscribe).toHaveBeenCalled();
  });
});
