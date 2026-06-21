import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsvMenuComponent } from './msv-menu.component';
import { MsvMenuItemComponent } from './msv-menu-item.component';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

@Component({
  template: `
    <msv-menu>
      <msv-menu-item>Item 1</msv-menu-item>
      <msv-menu-item>Item 2</msv-menu-item>
      <msv-menu-item [disabled]="true">Item 3 (Disabled)</msv-menu-item>
    </msv-menu>
  `
})
class TestMenuHostComponent {}

describe('MsvMenuComponent', () => {
  let component: MsvMenuComponent;
  let fixture: ComponentFixture<MsvMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvMenuComponent, MsvMenuItemComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render menu panel', () => {
    const panel = fixture.nativeElement.querySelector('.msv-menu-panel');
    expect(panel).toBeTruthy();
  });

  it('should have role="menu"', () => {
    const panel = fixture.nativeElement.querySelector('.msv-menu-panel');
    expect(panel.getAttribute('role')).toBe('menu');
  });
});

describe('MsvMenuComponent with items', () => {
  let fixture: ComponentFixture<TestMenuHostComponent>;
  let menuComponent: MsvMenuComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvMenuComponent, MsvMenuItemComponent, TestMenuHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestMenuHostComponent);
    fixture.detectChanges();

    const menuDebugElement = fixture.debugElement.query(By.directive(MsvMenuComponent));
    menuComponent = menuDebugElement.componentInstance;
  });

  it('should contain menu items', () => {
    expect(menuComponent.menuItems.length).toBe(3);
  });

  it('should focus next item on ArrowDown', () => {
    const items = menuComponent.menuItems.toArray();
    spyOn(items[0], 'focus');

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    menuComponent.onKeyDown(event);

    expect(items[0].focus).toHaveBeenCalled();
  });

  it('should skip disabled items when navigating with ArrowDown', () => {
    const items = menuComponent.menuItems.toArray();
    items[0].focus();
    
    spyOn(items[1], 'focus');
    
    // Simulate ArrowDown from first item
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    menuComponent.onKeyDown(event);

    expect(items[1].focus).toHaveBeenCalled();
  });

  it('should focus previous item on ArrowUp', () => {
    const items = menuComponent.menuItems.toArray();
    items[1].focus();
    
    spyOn(items[0], 'focus');
    
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    menuComponent.onKeyDown(event);

    expect(items[0].focus).toHaveBeenCalled();
  });

  it('should focus first item on Home key', () => {
    const items = menuComponent.menuItems.toArray();
    spyOn(items[0], 'focus');

    const event = new KeyboardEvent('keydown', { key: 'Home' });
    menuComponent.onKeyDown(event);

    expect(items[0].focus).toHaveBeenCalled();
  });

  it('should focus last enabled item on End key', () => {
    const items = menuComponent.menuItems.toArray();
    const enabledItems = items.filter(item => !item.disabled);
    spyOn(enabledItems[enabledItems.length - 1], 'focus');

    const event = new KeyboardEvent('keydown', { key: 'End' });
    menuComponent.onKeyDown(event);

    expect(enabledItems[enabledItems.length - 1].focus).toHaveBeenCalled();
  });

  it('should wrap to first item when navigating down from last item', () => {
    const items = menuComponent.menuItems.toArray();
    const enabledItems = items.filter(item => !item.disabled);
    
    // Focus last enabled item
    enabledItems[enabledItems.length - 1].focus();
    
    spyOn(enabledItems[0], 'focus');
    
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    menuComponent.onKeyDown(event);

    expect(enabledItems[0].focus).toHaveBeenCalled();
  });

  it('should focus first enabled item when focusFirstEnabledItem is called', () => {
    const items = menuComponent.menuItems.toArray();
    const enabledItems = items.filter(item => !item.disabled);
    spyOn(enabledItems[0], 'focus');

    menuComponent.focusFirstEnabledItem();

    expect(enabledItems[0].focus).toHaveBeenCalled();
  });
});
