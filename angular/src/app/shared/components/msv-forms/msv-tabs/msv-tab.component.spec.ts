import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsvTabComponent } from './msv-tab.component';

describe('MsvTabComponent', () => {
  let component: MsvTabComponent;
  let fixture: ComponentFixture<MsvTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvTabComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have empty label by default', () => {
    expect(component.label).toBe('');
  });

  it('should have disabled false by default', () => {
    expect(component.disabled).toBe(false);
  });

  it('should accept label input', () => {
    component.label = 'Test Tab';
    expect(component.label).toBe('Test Tab');
  });

  it('should accept disabled input', () => {
    component.disabled = true;
    expect(component.disabled).toBe(true);
  });

  it('should have content template', () => {
    expect(component.content).toBeTruthy();
  });
});
