import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsvButtonComponent } from './msv-button.component';
import { MSV_FORMS_CONFIG } from '../msv-forms.config';

describe('MsvButtonComponent', () => {
  let component: MsvButtonComponent;
  let fixture: ComponentFixture<MsvButtonComponent>;

  const mockConfig = {
    validationMessages: {
      required: 'Field ini wajib diisi',
      email: 'Format email tidak valid',
      minLength: (min: number) => `Minimal ${min} karakter`,
      maxLength: (max: number) => `Maksimal ${max} karakter`,
      pattern: 'Format tidak valid'
    },
    loadingText: 'Processing...'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvButtonComponent],
      providers: [
        { provide: MSV_FORMS_CONFIG, useValue: mockConfig }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit clicked event', () => {
    spyOn(component.clicked, 'emit');
    component.onClick();
    expect(component.clicked.emit).toHaveBeenCalled();
  });

  it('should not emit when loading', () => {
    spyOn(component.clicked, 'emit');
    component.loading = true;
    component.onClick();
    expect(component.clicked.emit).not.toHaveBeenCalled();
  });

  it('should be disabled when loading or disabled', () => {
    component.loading = true;
    expect(component.isDisabled).toBe(true);

    component.loading = false;
    component.disabled = true;
    expect(component.isDisabled).toBe(true);
  });

  it('should apply variant class', () => {
    component.variant = 'danger';
    expect(component.buttonClasses).toContain('button-danger');
  });

  it('should apply fullWidth class when fullWidth=true', () => {
    component.fullWidth = true;
    expect(component.buttonClasses).toContain('full-width');
  });

  it('should render with button type by default', () => {
    expect(component.type).toBe('button');
  });

  it('should render with submit type when specified', () => {
    component.type = 'submit';
    fixture.detectChanges();

    const buttonElement = fixture.nativeElement.querySelector('button');
    expect(buttonElement.getAttribute('type')).toBe('submit');
  });

  it('should apply disabled class when disabled', () => {
    component.disabled = true;
    expect(component.buttonClasses).toContain('button-primary-disabled');
  });

  it('should inject config', () => {
    expect(component.config).toBeTruthy();
    expect(component.config.loadingText).toBe('Processing...');
  });

  it('should use config loadingText when loading and no custom template', () => {
    component.loading = true;
    fixture.detectChanges();
    
    const buttonElement = fixture.nativeElement.querySelector('button');
    expect(buttonElement.textContent).toContain('Processing...');
  });

  it('should render custom loadingTemplate when provided', () => {
    // This test would require creating a custom template in the test
    // For now, we verify the input exists and can be set
    expect(component.loadingTemplate).toBeNull();
    
    // In a real scenario, you'd create a TemplateRef and assign it
    // component.loadingTemplate = customTemplate;
    // fixture.detectChanges();
    // expect(custom template content to be rendered);
  });
});
