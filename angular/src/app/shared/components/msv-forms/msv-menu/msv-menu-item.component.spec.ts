import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsvMenuItemComponent } from './msv-menu-item.component';

describe('MsvMenuItemComponent', () => {
  let component: MsvMenuItemComponent;
  let fixture: ComponentFixture<MsvMenuItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MsvMenuItemComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have disabled false by default', () => {
    expect(component.disabled).toBe(false);
  });

  it('should emit triggered event on click when enabled', () => {
    spyOn(component.triggered, 'emit');
    
    const event = new MouseEvent('click');
    component.onClick(event);

    expect(component.triggered.emit).toHaveBeenCalled();
  });

  it('should not emit triggered event on click when disabled', () => {
    component.disabled = true;
    spyOn(component.triggered, 'emit');
    
    const event = new MouseEvent('click');
    component.onClick(event);

    expect(component.triggered.emit).not.toHaveBeenCalled();
  });

  it('should emit triggered event on Enter key when enabled', () => {
    spyOn(component.triggered, 'emit');
    
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(event, 'preventDefault');
    component.onActivate(event);

    expect(component.triggered.emit).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should emit triggered event on Space key when enabled', () => {
    spyOn(component.triggered, 'emit');
    
    const event = new KeyboardEvent('keydown', { key: ' ' });
    spyOn(event, 'preventDefault');
    component.onActivate(event);

    expect(component.triggered.emit).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should not emit triggered event on Enter key when disabled', () => {
    component.disabled = true;
    spyOn(component.triggered, 'emit');
    
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    component.onActivate(event);

    expect(component.triggered.emit).not.toHaveBeenCalled();
  });

  it('should have role="menuitem"', () => {
    expect(component.role).toBe('menuitem');
  });

  it('should have tabindex 0 when enabled', () => {
    component.disabled = false;
    expect(component.tabIndex).toBe(0);
  });

  it('should have tabindex -1 when disabled', () => {
    component.disabled = true;
    expect(component.tabIndex).toBe(-1);
  });

  it('should have aria-disabled="false" when enabled', () => {
    component.disabled = false;
    expect(component.ariaDisabled).toBe('false');
  });

  it('should have aria-disabled="true" when disabled', () => {
    component.disabled = true;
    expect(component.ariaDisabled).toBe('true');
  });

  it('should add disabled class when disabled', () => {
    component.disabled = true;
    expect(component.isDisabled).toBe(true);
  });

  it('should emit focused event on focus when enabled', () => {
    spyOn(component.focused, 'emit');
    
    component.onFocus();

    expect(component.focused.emit).toHaveBeenCalled();
  });

  it('should not emit focused event on focus when disabled', () => {
    component.disabled = true;
    spyOn(component.focused, 'emit');
    
    component.onFocus();

    expect(component.focused.emit).not.toHaveBeenCalled();
  });

  it('should focus element when focus() is called', () => {
    const nativeElement = fixture.nativeElement;
    spyOn(nativeElement, 'focus');
    
    component.focus();

    expect(nativeElement.focus).toHaveBeenCalled();
  });

  it('should render content', () => {
    fixture.nativeElement.textContent = 'Test Item';
    fixture.detectChanges();
    
    expect(fixture.nativeElement.textContent).toContain('Test Item');
  });

  it('should have disabled class in content when disabled', () => {
    component.disabled = true;
    fixture.detectChanges();
    
    const content = fixture.nativeElement.querySelector('.msv-menu-item-content');
    expect(content.classList.contains('disabled')).toBe(true);
  });
});
