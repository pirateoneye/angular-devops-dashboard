import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MsvToggleComponent } from './msv-toggle.component';

describe('MsvToggleComponent', () => {
  let component: MsvToggleComponent;
  let fixture: ComponentFixture<MsvToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, MsvToggleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should implement ControlValueAccessor', () => {
    expect(component.writeValue).toBeDefined();
    expect(component.registerOnChange).toBeDefined();
    expect(component.registerOnTouched).toBeDefined();
    expect(component.setDisabledState).toBeDefined();
  });

  it('should initialize with default values', () => {
    expect(component.value).toBe(false);
    expect(component.label).toBe('');
    expect(component.labelPosition).toBe('after');
    expect(component.disabled).toBe(false);
  });

  it('should toggle value on click', () => {
    const spy = jasmine.createSpy('onChange');
    component.registerOnChange(spy);

    expect(component.value).toBe(false);
    component.toggle();
    expect(component.value).toBe(true);
    expect(spy).toHaveBeenCalledWith(true);

    component.toggle();
    expect(component.value).toBe(false);
    expect(spy).toHaveBeenCalledWith(false);
  });

  it('should not toggle when disabled', () => {
    component.disabled = true;
    component.value = false;

    component.toggle();

    expect(component.value).toBe(false);
  });

  it('should write value correctly', () => {
    component.writeValue(true);
    expect(component.value).toBe(true);

    component.writeValue(false);
    expect(component.value).toBe(false);

    component.writeValue(null as any);
    expect(component.value).toBe(false);
  });

  it('should call onChange callback on toggle', () => {
    const spy = jasmine.createSpy('onChange');
    component.registerOnChange(spy);

    component.toggle();

    expect(spy).toHaveBeenCalledWith(true);
  });

  it('should call onTouched callback on toggle', () => {
    const spy = jasmine.createSpy('onTouched');
    component.registerOnTouched(spy);

    component.toggle();

    expect(spy).toHaveBeenCalled();
  });

  it('should set disabled state', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);

    component.setDisabledState(false);
    expect(component.disabled).toBe(false);
  });

  it('should toggle on Space key press', () => {
    component.value = false;
    const event = new KeyboardEvent('keydown', { key: ' ' });
    spyOn(event, 'preventDefault');

    component.onKeyDown(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.value).toBe(true);
  });

  it('should toggle on Enter key press', () => {
    component.value = false;
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(event, 'preventDefault');

    component.onKeyDown(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.value).toBe(true);
  });

  it('should not toggle on other key presses', () => {
    component.value = false;
    const event = new KeyboardEvent('keydown', { key: 'a' });

    component.onKeyDown(event);

    expect(component.value).toBe(false);
  });

  it('should render label before toggle when labelPosition is before', () => {
    component.label = 'Test Label';
    component.labelPosition = 'before';
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const labelBefore = compiled.querySelector('.msv-toggle-label-before');
    expect(labelBefore).toBeTruthy();
    expect(labelBefore.textContent.trim()).toBe('Test Label');
  });

  it('should render label after toggle when labelPosition is after', () => {
    component.label = 'Test Label';
    component.labelPosition = 'after';
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const labelAfter = compiled.querySelector('.msv-toggle-label-after');
    expect(labelAfter).toBeTruthy();
    expect(labelAfter.textContent.trim()).toBe('Test Label');
  });

  it('should apply checked class when value is true', () => {
    component.value = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const track = compiled.querySelector('.msv-toggle-track');
    expect(track.classList.contains('checked')).toBe(true);
  });

  it('should apply disabled class when disabled is true', () => {
    component.disabled = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const track = compiled.querySelector('.msv-toggle-track');
    expect(track.classList.contains('disabled')).toBe(true);
  });

  it('should have correct aria attributes', () => {
    component.value = true;
    component.disabled = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const track = compiled.querySelector('.msv-toggle-track');
    expect(track.getAttribute('role')).toBe('switch');
    expect(track.getAttribute('aria-checked')).toBe('true');
    expect(track.getAttribute('aria-disabled')).toBe('false');
  });
});
