import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsvAccordionComponent } from './msv-accordion.component';
import { MsvAccordionItemComponent } from './msv-accordion-item.component';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('MsvAccordionComponent', () => {
  let component: MsvAccordionComponent;
  let fixture: ComponentFixture<MsvAccordionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvAccordionComponent, MsvAccordionItemComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have multi input property with default false', () => {
    expect(component.multi).toBe(false);
  });

  it('should accept multi input property', () => {
    component.multi = true;
    expect(component.multi).toBe(true);
  });
});

describe('MsvAccordionComponent with items', () => {
  @Component({
    template: `
      <msv-accordion [multi]="multi">
        <msv-accordion-item title="Item 1" [expanded]="item1Expanded">Content 1</msv-accordion-item>
        <msv-accordion-item title="Item 2" [expanded]="item2Expanded">Content 2</msv-accordion-item>
        <msv-accordion-item title="Item 3" [expanded]="item3Expanded">Content 3</msv-accordion-item>
      </msv-accordion>
    `
  })
  class TestHostComponent {
    multi = false;
    item1Expanded = false;
    item2Expanded = false;
    item3Expanded = false;
  }

  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let accordionComponent: MsvAccordionComponent;
  let accordionItems: DebugElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvAccordionComponent, MsvAccordionItemComponent, TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();

    const accordionDebugElement = fixture.debugElement.query(By.directive(MsvAccordionComponent));
    accordionComponent = accordionDebugElement.componentInstance;
    accordionItems = fixture.debugElement.queryAll(By.directive(MsvAccordionItemComponent));
  });

  it('should contain accordion items', () => {
    expect(accordionItems.length).toBe(3);
  });

  it('should close other items when opening one in single mode', async () => {
    hostComponent.multi = false;
    fixture.detectChanges();
    await fixture.whenStable();

    // Open first item
    const firstHeader = accordionItems[0].query(By.css('.msv-accordion-header'));
    firstHeader.nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(accordionItems[0].componentInstance.expanded).toBe(true);
    expect(accordionItems[1].componentInstance.expanded).toBe(false);
    expect(accordionItems[2].componentInstance.expanded).toBe(false);

    // Open second item - should close first
    const secondHeader = accordionItems[1].query(By.css('.msv-accordion-header'));
    secondHeader.nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(accordionItems[0].componentInstance.expanded).toBe(false);
    expect(accordionItems[1].componentInstance.expanded).toBe(true);
    expect(accordionItems[2].componentInstance.expanded).toBe(false);
  });

  it('should allow multiple items open in multi mode', async () => {
    hostComponent.multi = true;
    fixture.detectChanges();
    await fixture.whenStable();

    // Open first item
    const firstHeader = accordionItems[0].query(By.css('.msv-accordion-header'));
    firstHeader.nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();

    // Open second item
    const secondHeader = accordionItems[1].query(By.css('.msv-accordion-header'));
    secondHeader.nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(accordionItems[0].componentInstance.expanded).toBe(true);
    expect(accordionItems[1].componentInstance.expanded).toBe(true);
    expect(accordionItems[2].componentInstance.expanded).toBe(false);
  });

  it('should expand item initially if expanded input is true', () => {
    hostComponent.item1Expanded = true;
    fixture.detectChanges();

    expect(accordionItems[0].componentInstance.expanded).toBe(true);
    expect(accordionItems[1].componentInstance.expanded).toBe(false);
    expect(accordionItems[2].componentInstance.expanded).toBe(false);
  });
});

describe('MsvAccordionItemComponent', () => {
  let component: MsvAccordionItemComponent;
  let fixture: ComponentFixture<MsvAccordionItemComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvAccordionItemComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvAccordionItemComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.title).toBe('');
    expect(component.expanded).toBe(false);
    expect(component.disabled).toBe(false);
  });

  it('should display title', () => {
    component.title = 'Test Title';
    fixture.detectChanges();

    const titleElement = compiled.querySelector('.msv-accordion-title');
    expect(titleElement?.textContent).toContain('Test Title');
  });

  it('should toggle expanded state on click', () => {
    const button = compiled.querySelector('.msv-accordion-header') as HTMLButtonElement;
    expect(component.expanded).toBe(false);

    button.click();
    expect(component.expanded).toBe(true);

    button.click();
    expect(component.expanded).toBe(false);
  });

  it('should emit expandedChange event on toggle', () => {
    spyOn(component.expandedChange, 'emit');
    component.toggle();

    expect(component.expandedChange.emit).toHaveBeenCalledWith(true);
  });

  it('should not toggle when disabled', () => {
    component.disabled = true;
    component.expanded = false;
    fixture.detectChanges();

    component.toggle();
    expect(component.expanded).toBe(false);
  });

  it('should add disabled class when disabled', () => {
    component.disabled = true;
    fixture.detectChanges();

    const item = compiled.querySelector('.msv-accordion-item');
    expect(item?.classList.contains('disabled')).toBe(true);
  });

  it('should rotate chevron when expanded', () => {
    component.expanded = false;
    fixture.detectChanges();
    let chevron = compiled.querySelector('.msv-accordion-chevron');
    expect(chevron?.classList.contains('rotated')).toBe(false);

    component.expanded = true;
    fixture.detectChanges();
    chevron = compiled.querySelector('.msv-accordion-chevron');
    expect(chevron?.classList.contains('rotated')).toBe(true);
  });

  it('should show content wrapper when expanded', () => {
    component.expanded = false;
    fixture.detectChanges();
    let wrapper = compiled.querySelector('.msv-accordion-content-wrapper');
    expect(wrapper?.classList.contains('expanded')).toBe(false);

    component.expanded = true;
    fixture.detectChanges();
    wrapper = compiled.querySelector('.msv-accordion-content-wrapper');
    expect(wrapper?.classList.contains('expanded')).toBe(true);
  });

  it('should set aria-expanded attribute correctly', () => {
    component.expanded = false;
    fixture.detectChanges();
    let button = compiled.querySelector('.msv-accordion-header') as HTMLButtonElement;
    expect(button.getAttribute('aria-expanded')).toBe('false');

    component.expanded = true;
    fixture.detectChanges();
    button = compiled.querySelector('.msv-accordion-header') as HTMLButtonElement;
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('should set aria-disabled attribute correctly', () => {
    component.disabled = false;
    fixture.detectChanges();
    let button = compiled.querySelector('.msv-accordion-header') as HTMLButtonElement;
    expect(button.getAttribute('aria-disabled')).toBe('false');

    component.disabled = true;
    fixture.detectChanges();
    button = compiled.querySelector('.msv-accordion-header') as HTMLButtonElement;
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('should allow programmatic expansion via setExpanded', () => {
    component.setExpanded(true);
    expect(component.expanded).toBe(true);

    component.setExpanded(false);
    expect(component.expanded).toBe(false);
  });
});

describe('MsvAccordionItemComponent with content', () => {
  @Component({
    template: `
      <msv-accordion-item title="Test" [expanded]="true">
        <p>Test Content</p>
      </msv-accordion-item>
    `
  })
  class TestContentComponent {}

  let fixture: ComponentFixture<TestContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvAccordionItemComponent, TestContentComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestContentComponent);
    fixture.detectChanges();
  });

  it('should render content in expanded state', () => {
    const content = fixture.nativeElement.querySelector('.msv-accordion-content');
    expect(content?.textContent).toContain('Test Content');
  });
});
