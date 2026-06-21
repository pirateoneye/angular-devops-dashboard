import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { MsvModalComponent } from './msv-modal.component';
import { MsvModalRef } from './msv-modal-ref';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';

@Component({
  template: `<div>Test Content</div>`
})
class TestContentComponent {}

describe('MsvModalComponent', () => {
  let component: MsvModalComponent;
  let fixture: ComponentFixture<MsvModalComponent>;
  let mockModalRef: jasmine.SpyObj<MsvModalRef>;

  beforeEach(async () => {
    mockModalRef = jasmine.createSpyObj('MsvModalRef', ['close']);

    await TestBed.configureTestingModule({
      declarations: [MsvModalComponent],
      imports: [CommonModule, OverlayModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MsvModalComponent);
    component = fixture.componentInstance;
    component.modalRef = mockModalRef;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default closable as true', () => {
    expect(component.closable).toBe(true);
  });

  it('should have default size as medium', () => {
    expect(component.size).toBe('medium');
  });

  it('should return correct size class for small', () => {
    component.size = 'small';
    expect(component.getSizeClass()).toBe('msv-modal-small');
  });

  it('should return correct size class for medium', () => {
    component.size = 'medium';
    expect(component.getSizeClass()).toBe('msv-modal-medium');
  });

  it('should return correct size class for large', () => {
    component.size = 'large';
    expect(component.getSizeClass()).toBe('msv-modal-large');
  });

  it('should close modal on backdrop click when closable is true', () => {
    component.closable = true;
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', {
      value: fixture.nativeElement,
      writable: false
    });
    
    component.onBackdropClick(event);
    
    expect(mockModalRef.close).toHaveBeenCalled();
  });

  it('should not close modal on backdrop click when closable is false', () => {
    component.closable = false;
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', {
      value: fixture.nativeElement,
      writable: false
    });
    
    component.onBackdropClick(event);
    
    expect(mockModalRef.close).not.toHaveBeenCalled();
  });

  it('should not close modal on content click', () => {
    component.closable = true;
    const contentElement = document.createElement('div');
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', {
      value: contentElement,
      writable: false
    });
    
    component.onBackdropClick(event);
    
    expect(mockModalRef.close).not.toHaveBeenCalled();
  });

  it('should close modal on escape key when closable is true', () => {
    component.closable = true;
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    spyOn(event, 'preventDefault');
    
    component.onEscapeKey(event);
    
    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockModalRef.close).toHaveBeenCalled();
  });

  it('should not close modal on escape key when closable is false', () => {
    component.closable = false;
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    
    component.onEscapeKey(event);
    
    expect(mockModalRef.close).not.toHaveBeenCalled();
  });

  it('should display close button when closable is true', () => {
    component.closable = true;
    fixture.detectChanges();
    
    const closeButton = fixture.nativeElement.querySelector('.msv-modal-close');
    expect(closeButton).toBeTruthy();
  });

  it('should not display close button when closable is false', () => {
    component.closable = false;
    fixture.detectChanges();
    
    const closeButton = fixture.nativeElement.querySelector('.msv-modal-close');
    expect(closeButton).toBeFalsy();
  });

  it('should call close when close button is clicked', () => {
    component.closable = true;
    fixture.detectChanges();
    
    const closeButton = fixture.nativeElement.querySelector('.msv-modal-close') as HTMLButtonElement;
    closeButton.click();
    
    expect(mockModalRef.close).toHaveBeenCalled();
  });

  it('should apply correct size class to container', () => {
    component.size = 'large';
    fixture.detectChanges();
    
    const container = fixture.nativeElement.querySelector('.msv-modal-container');
    expect(container.classList.contains('msv-modal-large')).toBe(true);
  });

  it('should project header content', () => {
    const testFixture = TestBed.createComponent(MsvModalComponent);
    const testComponent = testFixture.componentInstance;
    testComponent.modalRef = mockModalRef;
    
    const headerContent = document.createElement('div');
    headerContent.setAttribute('msvModalHeader', '');
    headerContent.textContent = 'Test Header';
    testFixture.nativeElement.querySelector('.msv-modal-header')?.appendChild(headerContent);
    
    testFixture.detectChanges();
    
    expect(testFixture.nativeElement.textContent).toContain('Test Header');
  });

  it('should project footer content', () => {
    const testFixture = TestBed.createComponent(MsvModalComponent);
    const testComponent = testFixture.componentInstance;
    testComponent.modalRef = mockModalRef;
    
    const footerContent = document.createElement('div');
    footerContent.setAttribute('msvModalFooter', '');
    footerContent.textContent = 'Test Footer';
    testFixture.nativeElement.querySelector('.msv-modal-footer')?.appendChild(footerContent);
    
    testFixture.detectChanges();
    
    expect(testFixture.nativeElement.textContent).toContain('Test Footer');
  });

  it('should not call close if modalRef is undefined', () => {
    component.modalRef = undefined;
    
    expect(() => component.close()).not.toThrow();
  });
});
