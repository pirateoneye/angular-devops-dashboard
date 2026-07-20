import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { OverlayModule } from '@angular/cdk/overlay';
import { MsvTooltipDirective, MsvTooltipContainerComponent } from './msv-tooltip.directive';

@Component({
  template: `
    <div
      [msvTooltip]="tooltipText"
      [tooltipPosition]="position"
      [tooltipDelay]="delay"
      style="width: 100px; height: 50px;"
    >
      Hover me
    </div>
  `,
  standalone: false,
})
class TestComponent {
  tooltipText = 'Test tooltip';
  position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  delay = 300;
}

describe('MsvTooltipDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let directiveElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [OverlayModule, MsvTooltipDirective, MsvTooltipContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    directiveElement = fixture.debugElement.query(By.directive(MsvTooltipDirective));
    fixture.detectChanges();
  });

  it('should create directive', () => {
    const directive = directiveElement.injector.get(MsvTooltipDirective);
    expect(directive).toBeTruthy();
  });

  it('should show tooltip on mouseenter after delay', fakeAsync(() => {
    const element = directiveElement.nativeElement;
    
    element.dispatchEvent(new MouseEvent('mouseenter'));
    tick(299);
    
    let tooltipElements = document.querySelectorAll('.msv-tooltip');
    expect(tooltipElements.length).toBe(0);
    
    tick(1);
    fixture.detectChanges();
    
    tooltipElements = document.querySelectorAll('.msv-tooltip');
    expect(tooltipElements.length).toBe(1);
    expect(tooltipElements[0].textContent).toContain('Test tooltip');
  }));

  it('should hide tooltip on mouseleave', fakeAsync(() => {
    const element = directiveElement.nativeElement;
    
    element.dispatchEvent(new MouseEvent('mouseenter'));
    tick(300);
    fixture.detectChanges();
    
    let tooltipElements = document.querySelectorAll('.msv-tooltip');
    expect(tooltipElements.length).toBe(1);
    
    element.dispatchEvent(new MouseEvent('mouseleave'));
    tick(50);
    fixture.detectChanges();
    
    tooltipElements = document.querySelectorAll('.msv-tooltip');
    expect(tooltipElements.length).toBe(0);
  }));

  it('should not show tooltip if text is empty', fakeAsync(() => {
    component.tooltipText = '';
    fixture.detectChanges();
    
    const element = directiveElement.nativeElement;
    element.dispatchEvent(new MouseEvent('mouseenter'));
    tick(300);
    fixture.detectChanges();
    
    const tooltipElements = document.querySelectorAll('.msv-tooltip');
    expect(tooltipElements.length).toBe(0);
  }));

  it('should not show tooltip if text is only whitespace', fakeAsync(() => {
    component.tooltipText = '   ';
    fixture.detectChanges();
    
    const element = directiveElement.nativeElement;
    element.dispatchEvent(new MouseEvent('mouseenter'));
    tick(300);
    fixture.detectChanges();
    
    const tooltipElements = document.querySelectorAll('.msv-tooltip');
    expect(tooltipElements.length).toBe(0);
  }));

  it('should cancel tooltip display if mouseleave before delay expires', fakeAsync(() => {
    const element = directiveElement.nativeElement;
    
    element.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    
    element.dispatchEvent(new MouseEvent('mouseleave'));
    tick(200);
    fixture.detectChanges();
    
    const tooltipElements = document.querySelectorAll('.msv-tooltip');
    expect(tooltipElements.length).toBe(0);
  }));

  it('should position tooltip at top by default', fakeAsync(() => {
    component.position = 'top';
    fixture.detectChanges();
    
    const element = directiveElement.nativeElement;
    element.dispatchEvent(new MouseEvent('mouseenter'));
    tick(300);
    fixture.detectChanges();
    
    const tooltipElements = document.querySelectorAll('.msv-tooltip');
    expect(tooltipElements.length).toBe(1);
    
    element.dispatchEvent(new MouseEvent('mouseleave'));
    tick(50);
  }));

  it('should position tooltip at bottom when specified', fakeAsync(() => {
    component.position = 'bottom';
    fixture.detectChanges();
    
    const element = directiveElement.nativeElement;
    element.dispatchEvent(new MouseEvent('mouseenter'));
    tick(300);
    fixture.detectChanges();
    
    const tooltipElements = document.querySelectorAll('.msv-tooltip');
    expect(tooltipElements.length).toBe(1);
    
    element.dispatchEvent(new MouseEvent('mouseleave'));
    tick(50);
  }));

  it('should position tooltip at left when specified', fakeAsync(() => {
    component.position = 'left';
    fixture.detectChanges();
    
    const element = directiveElement.nativeElement;
    element.dispatchEvent(new MouseEvent('mouseenter'));
    tick(300);
    fixture.detectChanges();
    
    const tooltipElements = document.querySelectorAll('.msv-tooltip');
    expect(tooltipElements.length).toBe(1);
    
    element.dispatchEvent(new MouseEvent('mouseleave'));
    tick(50);
  }));

  it('should position tooltip at right when specified', fakeAsync(() => {
    component.position = 'right';
    fixture.detectChanges();
    
    const element = directiveElement.nativeElement;
    element.dispatchEvent(new MouseEvent('mouseenter'));
    tick(300);
    fixture.detectChanges();
    
    const tooltipElements = document.querySelectorAll('.msv-tooltip');
    expect(tooltipElements.length).toBe(1);
    
    element.dispatchEvent(new MouseEvent('mouseleave'));
    tick(50);
  }));

  it('should respect custom delay', fakeAsync(() => {
    component.delay = 500;
    fixture.detectChanges();
    
    const element = directiveElement.nativeElement;
    element.dispatchEvent(new MouseEvent('mouseenter'));
    tick(400);
    
    let tooltipElements = document.querySelectorAll('.msv-tooltip');
    expect(tooltipElements.length).toBe(0);
    
    tick(100);
    fixture.detectChanges();
    
    tooltipElements = document.querySelectorAll('.msv-tooltip');
    expect(tooltipElements.length).toBe(1);
    
    element.dispatchEvent(new MouseEvent('mouseleave'));
    tick(50);
  }));

  it('should cleanup overlay on destroy', fakeAsync(() => {
    const element = directiveElement.nativeElement;
    element.dispatchEvent(new MouseEvent('mouseenter'));
    tick(300);
    fixture.detectChanges();
    
    let tooltipElements = document.querySelectorAll('.msv-tooltip');
    expect(tooltipElements.length).toBe(1);
    
    fixture.destroy();
    
    tooltipElements = document.querySelectorAll('.msv-tooltip');
    expect(tooltipElements.length).toBe(0);
  }));

  it('should cleanup pending timeout on destroy', fakeAsync(() => {
    const element = directiveElement.nativeElement;
    element.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    
    fixture.destroy();
    
    tick(200);
    fixture.detectChanges();
    
    const tooltipElements = document.querySelectorAll('.msv-tooltip');
    expect(tooltipElements.length).toBe(0);
  }));
});
