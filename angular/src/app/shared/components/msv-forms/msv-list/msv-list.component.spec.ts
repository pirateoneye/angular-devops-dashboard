import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { MsvListComponent } from './msv-list.component';
import { MsvListItemComponent } from './msv-list-item.component';
import { CommonModule } from '@angular/common';

@Component({
  template: `
    <msv-list [selectable]="selectable" [multiple]="multiple" (selectionChange)="onSelectionChange($event)">
      <msv-list-item [value]="'item1'">Item 1</msv-list-item>
      <msv-list-item [value]="'item2'">Item 2</msv-list-item>
      <msv-list-item [value]="'item3'" [disabled]="true">Item 3 (disabled)</msv-list-item>
      <msv-list-item [value]="'item4'">Item 4</msv-list-item>
    </msv-list>
  `
})
class TestHostComponent {
  selectable = false;
  multiple = false;
  selectedValues: any[] = [];

  onSelectionChange(values: any[]): void {
    this.selectedValues = values;
  }
}

describe('MsvListComponent', () => {
  let component: MsvListComponent;
  let fixture: ComponentFixture<MsvListComponent>;
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvListComponent, MsvListItemComponent, TestHostComponent],
      imports: [CommonModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with selectable false by default', () => {
    expect(component.selectable).toBe(false);
  });

  it('should initialize with multiple false by default', () => {
    expect(component.multiple).toBe(false);
  });

  describe('with host component', () => {
    beforeEach(() => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostComponent = hostFixture.componentInstance;
      hostFixture.detectChanges();
    });

    it('should render all list items', () => {
      const items = hostFixture.nativeElement.querySelectorAll('msv-list-item');
      expect(items.length).toBe(4);
    });

    it('should display list items with content projection', () => {
      const items = hostFixture.nativeElement.querySelectorAll('msv-list-item');
      expect(items[0].textContent.trim()).toBe('Item 1');
      expect(items[1].textContent.trim()).toBe('Item 2');
      expect(items[2].textContent.trim()).toBe('Item 3 (disabled)');
      expect(items[3].textContent.trim()).toBe('Item 4');
    });

    it('should not select items when selectable is false', () => {
      const items = hostFixture.nativeElement.querySelectorAll('msv-list-item');
      
      items[0].click();
      hostFixture.detectChanges();
      
      expect(items[0].classList.contains('selected')).toBe(false);
      expect(hostComponent.selectedValues.length).toBe(0);
    });

    it('should select item when clicked in selectable mode', () => {
      hostComponent.selectable = true;
      hostFixture.detectChanges();
      
      const items = hostFixture.nativeElement.querySelectorAll('msv-list-item');
      
      items[0].click();
      hostFixture.detectChanges();
      
      expect(items[0].classList.contains('selected')).toBe(true);
      expect(hostComponent.selectedValues).toEqual(['item1']);
    });

    it('should deselect item when clicked again in single selection mode', () => {
      hostComponent.selectable = true;
      hostFixture.detectChanges();
      
      const items = hostFixture.nativeElement.querySelectorAll('msv-list-item');
      
      items[0].click();
      hostFixture.detectChanges();
      expect(items[0].classList.contains('selected')).toBe(true);
      
      items[0].click();
      hostFixture.detectChanges();
      expect(items[0].classList.contains('selected')).toBe(false);
      expect(hostComponent.selectedValues).toEqual([]);
    });

    it('should only select one item at a time in single selection mode', () => {
      hostComponent.selectable = true;
      hostFixture.detectChanges();
      
      const items = hostFixture.nativeElement.querySelectorAll('msv-list-item');
      
      items[0].click();
      hostFixture.detectChanges();
      expect(items[0].classList.contains('selected')).toBe(true);
      expect(hostComponent.selectedValues).toEqual(['item1']);
      
      items[1].click();
      hostFixture.detectChanges();
      expect(items[0].classList.contains('selected')).toBe(false);
      expect(items[1].classList.contains('selected')).toBe(true);
      expect(hostComponent.selectedValues).toEqual(['item2']);
    });

    it('should select multiple items in multiple selection mode', () => {
      hostComponent.selectable = true;
      hostComponent.multiple = true;
      hostFixture.detectChanges();
      
      const items = hostFixture.nativeElement.querySelectorAll('msv-list-item');
      
      items[0].click();
      hostFixture.detectChanges();
      expect(items[0].classList.contains('selected')).toBe(true);
      expect(hostComponent.selectedValues).toContain('item1');
      
      items[1].click();
      hostFixture.detectChanges();
      expect(items[0].classList.contains('selected')).toBe(true);
      expect(items[1].classList.contains('selected')).toBe(true);
      expect(hostComponent.selectedValues).toContain('item1');
      expect(hostComponent.selectedValues).toContain('item2');
      expect(hostComponent.selectedValues.length).toBe(2);
    });

    it('should deselect items individually in multiple selection mode', () => {
      hostComponent.selectable = true;
      hostComponent.multiple = true;
      hostFixture.detectChanges();
      
      const items = hostFixture.nativeElement.querySelectorAll('msv-list-item');
      
      items[0].click();
      items[1].click();
      hostFixture.detectChanges();
      expect(hostComponent.selectedValues.length).toBe(2);
      
      items[0].click();
      hostFixture.detectChanges();
      expect(items[0].classList.contains('selected')).toBe(false);
      expect(items[1].classList.contains('selected')).toBe(true);
      expect(hostComponent.selectedValues).toEqual(['item2']);
    });

    it('should not select disabled items', () => {
      hostComponent.selectable = true;
      hostFixture.detectChanges();
      
      const items = hostFixture.nativeElement.querySelectorAll('msv-list-item');
      
      items[2].click();
      hostFixture.detectChanges();
      
      expect(items[2].classList.contains('selected')).toBe(false);
      expect(hostComponent.selectedValues).toEqual([]);
    });

    it('should apply disabled class to disabled items', () => {
      const items = hostFixture.nativeElement.querySelectorAll('msv-list-item');
      expect(items[2].classList.contains('disabled')).toBe(true);
    });

    it('should emit selectionChange event when selection changes', () => {
      hostComponent.selectable = true;
      hostFixture.detectChanges();
      
      spyOn(hostComponent, 'onSelectionChange');
      
      const items = hostFixture.nativeElement.querySelectorAll('msv-list-item');
      items[0].click();
      
      expect(hostComponent.onSelectionChange).toHaveBeenCalledWith(['item1']);
    });

    it('should apply hover styles to non-disabled items', () => {
      const items = hostFixture.nativeElement.querySelectorAll('msv-list-item');
      
      // Enabled item should have hover cursor
      const enabledItem = items[0];
      const computedStyle = window.getComputedStyle(enabledItem);
      expect(computedStyle.cursor).toBe('pointer');
    });

    it('should apply selectable class to list when selectable is true', () => {
      const list = hostFixture.nativeElement.querySelector('.msv-list');
      expect(list.classList.contains('selectable')).toBe(false);
      
      hostComponent.selectable = true;
      hostFixture.detectChanges();
      
      expect(list.classList.contains('selectable')).toBe(true);
    });

    it('should have border and padding on list container', () => {
      const list = hostFixture.nativeElement.querySelector('.msv-list');
      const computedStyle = window.getComputedStyle(list);
      
      expect(computedStyle.borderStyle).toContain('solid');
      expect(computedStyle.padding).toBeTruthy();
    });

    it('should clear selection when clearSelection is called', () => {
      hostComponent.selectable = true;
      hostComponent.multiple = true;
      hostFixture.detectChanges();
      
      const listComponent = hostFixture.debugElement.children[0].componentInstance;
      const items = hostFixture.nativeElement.querySelectorAll('msv-list-item');
      
      items[0].click();
      items[1].click();
      hostFixture.detectChanges();
      
      expect(hostComponent.selectedValues.length).toBe(2);
      
      listComponent.clearSelection();
      hostFixture.detectChanges();
      
      expect(items[0].classList.contains('selected')).toBe(false);
      expect(items[1].classList.contains('selected')).toBe(false);
      expect(hostComponent.selectedValues).toEqual([]);
    });

    it('should return selected values via getSelectedValues method', () => {
      hostComponent.selectable = true;
      hostComponent.multiple = true;
      hostFixture.detectChanges();
      
      const listComponent = hostFixture.debugElement.children[0].componentInstance;
      const items = hostFixture.nativeElement.querySelectorAll('msv-list-item');
      
      items[0].click();
      items[1].click();
      hostFixture.detectChanges();
      
      const selectedValues = listComponent.getSelectedValues();
      expect(selectedValues).toContain('item1');
      expect(selectedValues).toContain('item2');
      expect(selectedValues.length).toBe(2);
    });
  });
});

describe('MsvListItemComponent', () => {
  let component: MsvListItemComponent;
  let fixture: ComponentFixture<MsvListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvListItemComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with disabled false by default', () => {
    expect(component.disabled).toBe(false);
  });

  it('should accept value input', () => {
    component.value = 'test-value';
    expect(component.value).toBe('test-value');
  });

  it('should emit itemClick when clicked and not disabled', () => {
    spyOn(component.itemClick, 'emit');
    
    const element = fixture.nativeElement;
    element.click();
    
    expect(component.itemClick.emit).toHaveBeenCalledWith(component);
  });

  it('should not emit itemClick when clicked and disabled', () => {
    component.disabled = true;
    fixture.detectChanges();
    
    spyOn(component.itemClick, 'emit');
    
    const element = fixture.nativeElement;
    element.click();
    
    expect(component.itemClick.emit).not.toHaveBeenCalled();
  });

  it('should update selected state via setSelected method', () => {
    component.setSelected(true);
    expect(component.selected).toBe(true);
    
    component.setSelected(false);
    expect(component.selected).toBe(false);
  });
});
