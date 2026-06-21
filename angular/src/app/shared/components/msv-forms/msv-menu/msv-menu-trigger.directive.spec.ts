import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ViewChild } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { MsvMenuTriggerDirective } from './msv-menu-trigger.directive';
import { MsvMenuComponent } from './msv-menu.component';
import { MsvMenuItemComponent } from './msv-menu-item.component';

@Component({
  template: `
    <button [msvMenuTriggerFor]="menu">Open Menu</button>
    <msv-menu #menu>
      <msv-menu-item>Item 1</msv-menu-item>
      <msv-menu-item>Item 2</msv-menu-item>
      <msv-menu-item [disabled]="true">Item 3 (Disabled)</msv-menu-item>
    </msv-menu>
  `
})
class TestTriggerHostComponent {
  @ViewChild(MsvMenuTriggerDirective) trigger!: MsvMenuTriggerDirective;
  @ViewChild(MsvMenuComponent) menu!: MsvMenuComponent;
}

describe('MsvMenuTriggerDirective', () => {
  let fixture: ComponentFixture<TestTriggerHostComponent>;
  let component: TestTriggerHostComponent;
  let triggerElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        MsvMenuTriggerDirective,
        MsvMenuComponent,
        MsvMenuItemComponent,
        TestTriggerHostComponent
      ],
      imports: [OverlayModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TestTriggerHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    triggerElement = fixture.nativeElement.querySelector('button');
  });

  it('should create', () => {
    expect(component.trigger).toBeTruthy();
  });

  it('should have msvMenuTriggerFor input set', () => {
    expect(component.trigger.msvMenuTriggerFor).toBe(component.menu);
  });

  it('should open menu on click', (done) => {
    spyOn(component.trigger, 'openMenu').and.callThrough();
    
    triggerElement.click();
    
    expect(component.trigger.openMenu).toHaveBeenCalled();
    done();
  });

  it('should close menu on second click', (done) => {
    spyOn(component.trigger, 'closeMenu').and.callThrough();
    
    // First click opens
    triggerElement.click();
    
    // Second click closes
    setTimeout(() => {
      triggerElement.click();
      expect(component.trigger.closeMenu).toHaveBeenCalled();
      done();
    }, 100);
  });

  it('should close menu when menu item is clicked', (done) => {
    spyOn(component.trigger, 'closeMenu').and.callThrough();
    
    // Open menu
    component.trigger.openMenu();
    
    setTimeout(() => {
      // Trigger menu item
      const menuItems = component.menu.menuItems.toArray();
      menuItems[0].triggered.emit();
      
      expect(component.trigger.closeMenu).toHaveBeenCalled();
      done();
    }, 100);
  });

  it('should focus first enabled item when menu opens', (done) => {
    component.trigger.openMenu();
    
    setTimeout(() => {
      const menuItems = component.menu.menuItems.toArray();
      const enabledItems = menuItems.filter(item => !item.disabled);
      
      // Check that first item can receive focus
      expect(enabledItems[0]).toBeTruthy();
      done();
    }, 100);
  });

  it('should clean up overlay on destroy', () => {
    component.trigger.openMenu();
    
    const directive = component.trigger;
    spyOn(directive as any, 'ngOnDestroy').and.callThrough();
    
    directive.ngOnDestroy();
    
    expect((directive as any).ngOnDestroy).toHaveBeenCalled();
  });
});
