import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { MsvTabsComponent } from './msv-tabs.component';
import { MsvTabComponent } from './msv-tab.component';
import { CommonModule } from '@angular/common';

@Component({
  template: `
    <msv-tabs [(selectedIndex)]="selectedIndex">
      <msv-tab label="Tab 1">
        <div class="tab1-content">Content 1</div>
      </msv-tab>
      <msv-tab label="Tab 2">
        <div class="tab2-content">Content 2</div>
      </msv-tab>
      <msv-tab label="Tab 3" [disabled]="true">
        <div class="tab3-content">Content 3</div>
      </msv-tab>
    </msv-tabs>
  `
})
class TestHostComponent {
  selectedIndex = 0;
}

describe('MsvTabsComponent', () => {
  let component: MsvTabsComponent;
  let fixture: ComponentFixture<MsvTabsComponent>;
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvTabsComponent, MsvTabComponent, TestHostComponent],
      imports: [CommonModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvTabsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with selectedIndex 0 by default', () => {
    expect(component.selectedIndex).toBe(0);
  });

  describe('with host component', () => {
    beforeEach(() => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostComponent = hostFixture.componentInstance;
      hostFixture.detectChanges();
    });

    it('should render all tab labels', () => {
      const buttons = hostFixture.nativeElement.querySelectorAll('.tab-button');
      expect(buttons.length).toBe(3);
      expect(buttons[0].textContent.trim()).toBe('Tab 1');
      expect(buttons[1].textContent.trim()).toBe('Tab 2');
      expect(buttons[2].textContent.trim()).toBe('Tab 3');
    });

    it('should display first tab content by default', () => {
      const content = hostFixture.nativeElement.querySelector('.tab1-content');
      expect(content).toBeTruthy();
      expect(content.textContent.trim()).toBe('Content 1');
    });

    it('should switch content when clicking on tab', () => {
      const buttons = hostFixture.nativeElement.querySelectorAll('.tab-button');
      
      // Click second tab
      buttons[1].click();
      hostFixture.detectChanges();
      
      expect(hostComponent.selectedIndex).toBe(1);
      const content = hostFixture.nativeElement.querySelector('.tab2-content');
      expect(content).toBeTruthy();
      expect(content.textContent.trim()).toBe('Content 2');
    });

    it('should apply active class to selected tab', () => {
      const buttons = hostFixture.nativeElement.querySelectorAll('.tab-button');
      
      expect(buttons[0].classList.contains('tab-button-active')).toBe(true);
      expect(buttons[1].classList.contains('tab-button-active')).toBe(false);
      
      // Click second tab
      buttons[1].click();
      hostFixture.detectChanges();
      
      expect(buttons[0].classList.contains('tab-button-active')).toBe(false);
      expect(buttons[1].classList.contains('tab-button-active')).toBe(true);
    });

    it('should not select disabled tab', () => {
      const buttons = hostFixture.nativeElement.querySelectorAll('.tab-button');
      
      // Try to click disabled tab
      buttons[2].click();
      hostFixture.detectChanges();
      
      // Should still be on first tab
      expect(hostComponent.selectedIndex).toBe(0);
      const content = hostFixture.nativeElement.querySelector('.tab1-content');
      expect(content).toBeTruthy();
    });

    it('should apply disabled class to disabled tab', () => {
      const buttons = hostFixture.nativeElement.querySelectorAll('.tab-button');
      expect(buttons[2].classList.contains('tab-button-disabled')).toBe(true);
    });

    it('should emit selectedIndexChange when tab is clicked', () => {
      const tabsComponent = hostFixture.debugElement.children[0].componentInstance;
      spyOn(tabsComponent.selectedIndexChange, 'emit');
      
      const buttons = hostFixture.nativeElement.querySelectorAll('.tab-button');
      buttons[1].click();
      
      expect(tabsComponent.selectedIndexChange.emit).toHaveBeenCalledWith(1);
    });

    it('should support two-way binding with [(selectedIndex)]', () => {
      expect(hostComponent.selectedIndex).toBe(0);
      
      const buttons = hostFixture.nativeElement.querySelectorAll('.tab-button');
      buttons[1].click();
      hostFixture.detectChanges();
      
      expect(hostComponent.selectedIndex).toBe(1);
    });

    it('should navigate to next tab on ArrowRight', () => {
      const buttons = hostFixture.nativeElement.querySelectorAll('.tab-button');
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      Object.defineProperty(event, 'key', { value: 'ArrowRight' });
      spyOn(event, 'preventDefault');
      
      buttons[0].dispatchEvent(event);
      hostFixture.detectChanges();
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(hostComponent.selectedIndex).toBe(1);
    });

    it('should navigate to previous tab on ArrowLeft', () => {
      hostComponent.selectedIndex = 1;
      hostFixture.detectChanges();
      
      const buttons = hostFixture.nativeElement.querySelectorAll('.tab-button');
      
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      Object.defineProperty(event, 'key', { value: 'ArrowLeft' });
      spyOn(event, 'preventDefault');
      
      buttons[1].dispatchEvent(event);
      hostFixture.detectChanges();
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(hostComponent.selectedIndex).toBe(0);
    });

    it('should skip disabled tabs when navigating with keyboard', () => {
      hostComponent.selectedIndex = 1;
      hostFixture.detectChanges();
      
      const buttons = hostFixture.nativeElement.querySelectorAll('.tab-button');
      
      // Try to go right from Tab 2 (should wrap to Tab 1, skipping disabled Tab 3)
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      buttons[1].dispatchEvent(event);
      hostFixture.detectChanges();
      
      expect(hostComponent.selectedIndex).toBe(0);
    });

    it('should wrap around when navigating past last tab', () => {
      hostComponent.selectedIndex = 1;
      hostFixture.detectChanges();
      
      const buttons = hostFixture.nativeElement.querySelectorAll('.tab-button');
      
      // ArrowRight from Tab 2 should wrap to Tab 1 (skipping disabled Tab 3)
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      buttons[1].dispatchEvent(event);
      hostFixture.detectChanges();
      
      expect(hostComponent.selectedIndex).toBe(0);
    });

    it('should wrap around when navigating past first tab', () => {
      const buttons = hostFixture.nativeElement.querySelectorAll('.tab-button');
      
      // ArrowLeft from Tab 1 should wrap to Tab 2 (skipping disabled Tab 3)
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      buttons[0].dispatchEvent(event);
      hostFixture.detectChanges();
      
      expect(hostComponent.selectedIndex).toBe(1);
    });

    it('should set correct ARIA attributes', () => {
      const buttons = hostFixture.nativeElement.querySelectorAll('.tab-button');
      
      expect(buttons[0].getAttribute('role')).toBe('tab');
      expect(buttons[0].getAttribute('aria-selected')).toBe('true');
      expect(buttons[0].getAttribute('tabindex')).toBe('0');
      
      expect(buttons[1].getAttribute('aria-selected')).toBe('false');
      expect(buttons[1].getAttribute('tabindex')).toBe('-1');
      
      expect(buttons[2].getAttribute('aria-disabled')).toBe('true');
    });

    it('should render tab panel with correct role', () => {
      const panel = hostFixture.nativeElement.querySelector('[role="tabpanel"]');
      expect(panel).toBeTruthy();
    });

    it('should handle Home key to select first enabled tab', () => {
      hostComponent.selectedIndex = 1;
      hostFixture.detectChanges();
      
      const buttons = hostFixture.nativeElement.querySelectorAll('.tab-button');
      
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      spyOn(event, 'preventDefault');
      buttons[1].dispatchEvent(event);
      hostFixture.detectChanges();
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(hostComponent.selectedIndex).toBe(0);
    });

    it('should handle End key to select last enabled tab', () => {
      const buttons = hostFixture.nativeElement.querySelectorAll('.tab-button');
      
      const event = new KeyboardEvent('keydown', { key: 'End' });
      spyOn(event, 'preventDefault');
      buttons[0].dispatchEvent(event);
      hostFixture.detectChanges();
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(hostComponent.selectedIndex).toBe(1); // Tab 3 is disabled, so last enabled is Tab 2
    });
  });
});
