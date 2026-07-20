import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { MsvDividerComponent } from './msv-divider.component';

describe('MsvDividerComponent', () => {
  let component: MsvDividerComponent;
  let fixture: ComponentFixture<MsvDividerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, MsvDividerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvDividerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to horizontal orientation', () => {
    expect(component.orientation).toBe('horizontal');
    const dividerDiv = fixture.nativeElement.querySelector('.msv-divider');
    expect(dividerDiv.classList.contains('divider-horizontal')).toBe(true);
  });

  it('should render vertical orientation when set', () => {
    component.orientation = 'vertical';
    fixture.detectChanges();
    const dividerDiv = fixture.nativeElement.querySelector('.msv-divider');
    expect(dividerDiv.classList.contains('divider-vertical')).toBe(true);
    expect(dividerDiv.classList.contains('divider-horizontal')).toBe(false);
  });

  it('should display centered text when provided for horizontal divider', () => {
    component.orientation = 'horizontal';
    component.text = 'OR';
    fixture.detectChanges();
    const textElement = fixture.nativeElement.querySelector('.divider-text');
    expect(textElement).toBeTruthy();
    expect(textElement.textContent.trim()).toBe('OR');
    const dividerDiv = fixture.nativeElement.querySelector('.msv-divider');
    expect(dividerDiv.classList.contains('with-text')).toBe(true);
  });

  it('should not display text for vertical divider', () => {
    component.orientation = 'vertical';
    component.text = 'Should not appear';
    fixture.detectChanges();
    const textElement = fixture.nativeElement.querySelector('.divider-text');
    expect(textElement).toBeFalsy();
  });

  it('should apply dashed style when dashed is true', () => {
    component.dashed = true;
    fixture.detectChanges();
    const dividerDiv = fixture.nativeElement.querySelector('.msv-divider');
    expect(dividerDiv.classList.contains('divider-dashed')).toBe(true);
  });

  it('should not apply dashed style by default', () => {
    expect(component.dashed).toBe(false);
    const dividerDiv = fixture.nativeElement.querySelector('.msv-divider');
    expect(dividerDiv.classList.contains('divider-dashed')).toBe(false);
  });

  it('should render line elements for horizontal divider without text', () => {
    component.orientation = 'horizontal';
    component.text = '';
    fixture.detectChanges();
    const lineElements = fixture.nativeElement.querySelectorAll('.divider-line');
    expect(lineElements.length).toBe(1);
  });

  it('should render two line elements for horizontal divider with text', () => {
    component.orientation = 'horizontal';
    component.text = 'Section Break';
    fixture.detectChanges();
    const lineElements = fixture.nativeElement.querySelectorAll('.divider-line');
    expect(lineElements.length).toBe(2);
  });

  it('should have default values set correctly', () => {
    const newComponent = new MsvDividerComponent();
    expect(newComponent.orientation).toBe('horizontal');
    expect(newComponent.text).toBe('');
    expect(newComponent.dashed).toBe(false);
  });

  it('should correctly build divider classes', () => {
    component.orientation = 'horizontal';
    component.dashed = true;
    component.text = 'Test';
    expect(component.dividerClasses).toEqual(['divider-horizontal', 'divider-dashed', 'with-text']);
  });

  it('should build correct classes for vertical dashed divider', () => {
    component.orientation = 'vertical';
    component.dashed = true;
    expect(component.dividerClasses).toEqual(['divider-vertical', 'divider-dashed']);
  });

  it('should render divider line for vertical orientation', () => {
    component.orientation = 'vertical';
    fixture.detectChanges();
    const lineElement = fixture.nativeElement.querySelector('.divider-line');
    expect(lineElement).toBeTruthy();
  });
});
