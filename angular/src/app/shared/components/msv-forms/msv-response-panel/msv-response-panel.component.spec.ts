import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsvResponsePanelComponent } from './msv-response-panel.component';
import { MsvStatusBadgeComponent } from '../msv-status-badge/msv-status-badge.component';

describe('MsvResponsePanelComponent', () => {
  let component: MsvResponsePanelComponent;
  let fixture: ComponentFixture<MsvResponsePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvResponsePanelComponent, MsvStatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvResponsePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render msv-status-badge with response status', () => {
    component.response = { status: 'SUCCESS' };
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('msv-status-badge');
    expect(badge).toBeTruthy();
  });

  it('should display message when present', () => {
    component.response = { status: 'SUCCESS', message: 'Test message' };
    fixture.detectChanges();

    const messageText = fixture.nativeElement.querySelector('.message-text');
    expect(messageText.textContent).toContain('Test message');
  });

  it('should display JSON data when showData=true', () => {
    component.response = { status: 'SUCCESS', data: { id: 1 } };
    component.showData = true;
    fixture.detectChanges();

    const dataContent = fixture.nativeElement.querySelector('.data-content');
    expect(dataContent).toBeTruthy();
    expect(dataContent.textContent).toContain('"id": 1');
  });

  it('should hide data section when showData=false', () => {
    component.response = { status: 'SUCCESS', data: { id: 1 } };
    component.showData = false;
    fixture.detectChanges();

    const dataContent = fixture.nativeElement.querySelector('.data-content');
    expect(dataContent).toBeNull();
  });

  it('should render nothing when response is null', () => {
    component.response = null;
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.msv-response-panel');
    expect(panel).toBeNull();
  });
});
