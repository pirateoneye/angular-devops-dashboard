import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MsvCardComponent } from './msv-card.component';

@Component({
  template: `
    <msv-card [elevation]="elevation" [padding]="padding">
      <div msvCardHeader>Test Header</div>
      <div>Test Body Content</div>
      <div msvCardFooter>Test Footer</div>
    </msv-card>
  `
})
class TestHostComponent {
  elevation: 0 | 1 | 2 | 3 | 4 = 1;
  padding = true;
}

@Component({
  template: `
    <msv-card>
      <div>Body Only</div>
    </msv-card>
  `
})
class BodyOnlyHostComponent {}

describe('MsvCardComponent', () => {
  let component: MsvCardComponent;
  let fixture: ComponentFixture<MsvCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvCardComponent, TestHostComponent, BodyOnlyHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default elevation of 1', () => {
    expect(component.elevation).toBe(1);
    expect(component.cardClasses).toContain('elevation-1');
  });

  it('should have default padding of true', () => {
    expect(component.padding).toBe(true);
    expect(component.cardClasses).toContain('with-padding');
  });

  it('should apply elevation-0 class when elevation is 0', () => {
    component.elevation = 0;
    expect(component.cardClasses).toContain('elevation-0');
    expect(component.cardClasses).not.toContain('elevation-1');
  });

  it('should apply elevation-2 class when elevation is 2', () => {
    component.elevation = 2;
    expect(component.cardClasses).toContain('elevation-2');
  });

  it('should apply elevation-3 class when elevation is 3', () => {
    component.elevation = 3;
    expect(component.cardClasses).toContain('elevation-3');
  });

  it('should apply elevation-4 class when elevation is 4', () => {
    component.elevation = 4;
    expect(component.cardClasses).toContain('elevation-4');
  });

  it('should not apply with-padding class when padding is false', () => {
    component.padding = false;
    expect(component.cardClasses).not.toContain('with-padding');
  });

  it('should apply with-padding class when padding is true', () => {
    component.padding = true;
    expect(component.cardClasses).toContain('with-padding');
  });

  describe('Content Projection', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let hostComponent: TestHostComponent;
    let cardElement: DebugElement;

    beforeEach(() => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostComponent = hostFixture.componentInstance;
      hostFixture.detectChanges();
      cardElement = hostFixture.debugElement.query(By.directive(MsvCardComponent));
    });

    it('should project header content', () => {
      const headerElement = cardElement.nativeElement.querySelector('.msv-card-header');
      expect(headerElement).toBeTruthy();
      expect(headerElement.textContent.trim()).toContain('Test Header');
    });

    it('should project body content', () => {
      const bodyElement = cardElement.nativeElement.querySelector('.msv-card-body');
      expect(bodyElement).toBeTruthy();
      expect(bodyElement.textContent.trim()).toContain('Test Body Content');
    });

    it('should project footer content', () => {
      const footerElement = cardElement.nativeElement.querySelector('.msv-card-footer');
      expect(footerElement).toBeTruthy();
      expect(footerElement.textContent.trim()).toContain('Test Footer');
    });
  });

  describe('Content Projection - Body Only', () => {
    let hostFixture: ComponentFixture<BodyOnlyHostComponent>;
    let cardElement: DebugElement;

    beforeEach(() => {
      hostFixture = TestBed.createComponent(BodyOnlyHostComponent);
      hostFixture.detectChanges();
      cardElement = hostFixture.debugElement.query(By.directive(MsvCardComponent));
    });

    it('should render header section even without content', () => {
      const headerElement = cardElement.nativeElement.querySelector('.msv-card-header');
      expect(headerElement).toBeTruthy();
    });

    it('should render footer section even without content', () => {
      const footerElement = cardElement.nativeElement.querySelector('.msv-card-footer');
      expect(footerElement).toBeTruthy();
    });

    it('should always render body', () => {
      const bodyElement = cardElement.nativeElement.querySelector('.msv-card-body');
      expect(bodyElement).toBeTruthy();
      expect(bodyElement.textContent.trim()).toContain('Body Only');
    });
  });

  describe('Dynamic Input Changes', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let hostComponent: TestHostComponent;
    let cardElement: DebugElement;

    beforeEach(() => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostComponent = hostFixture.componentInstance;
      hostFixture.detectChanges();
      cardElement = hostFixture.debugElement.query(By.directive(MsvCardComponent));
    });

    it('should update elevation class when elevation input changes', () => {
      const cardComponent = cardElement.componentInstance as MsvCardComponent;
      
      hostComponent.elevation = 3;
      hostFixture.detectChanges();
      
      expect(cardComponent.elevation).toBe(3);
      expect(cardComponent.cardClasses).toContain('elevation-3');
    });

    it('should update padding class when padding input changes', () => {
      const cardComponent = cardElement.componentInstance as MsvCardComponent;
      
      hostComponent.padding = false;
      hostFixture.detectChanges();
      
      expect(cardComponent.padding).toBe(false);
      expect(cardComponent.cardClasses).not.toContain('with-padding');
    });
  });
});
