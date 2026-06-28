import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { InputFileUploadComponent } from './input-file-upload.component';

describe('InputFileUploadComponent', () => {
  let component: InputFileUploadComponent;
  let fixture: ComponentFixture<InputFileUploadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InputFileUploadComponent, HttpClientTestingModule]
    });
    fixture = TestBed.createComponent(InputFileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
