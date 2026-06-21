import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickHandleComponent } from './quick-handle.component';

describe('QuickHandleComponent', () => {
  let component: QuickHandleComponent;
  let fixture: ComponentFixture<QuickHandleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [QuickHandleComponent]
    });
    fixture = TestBed.createComponent(QuickHandleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
