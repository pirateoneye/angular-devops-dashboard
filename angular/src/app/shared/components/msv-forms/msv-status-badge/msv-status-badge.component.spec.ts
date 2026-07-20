import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsvStatusBadgeComponent } from './msv-status-badge.component';

describe('MsvStatusBadgeComponent', () => {
  let component: MsvStatusBadgeComponent;
  let fixture: ComponentFixture<MsvStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MsvStatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvStatusBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show Success with badge-available class for SUCCESS', () => {
    component.status = 'SUCCESS';
    expect(component.badgeClass).toBe('badge-available');
    expect(component.badgeText).toBe('Success');
  });

  it('should show Error with badge-failed class for ERROR', () => {
    component.status = 'ERROR';
    expect(component.badgeClass).toBe('badge-failed');
    expect(component.badgeText).toBe('Error');
  });

  it('should show Processing with badge-unavailable class for ON_PROCESS', () => {
    component.status = 'ON_PROCESS';
    expect(component.badgeClass).toBe('badge-unavailable');
    expect(component.badgeText).toBe('Processing...');
  });

  it('should render nothing for null status', () => {
    component.status = null;
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('div');
    expect(element).toBeNull();
  });
});
