import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsvTagComponent } from './msv-tag.component';

describe('MsvTagComponent', () => {
  let component: MsvTagComponent;
  let fixture: ComponentFixture<MsvTagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MsvTagComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvTagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply tag-primary class for primary color', () => {
    component.color = 'primary';
    expect(component.tagClass).toBe('tag-primary');
  });

  it('should apply tag-success class for success color', () => {
    component.color = 'success';
    expect(component.tagClass).toBe('tag-success');
  });

  it('should apply tag-warning class for warning color', () => {
    component.color = 'warning';
    expect(component.tagClass).toBe('tag-warning');
  });

  it('should apply tag-error class for error color', () => {
    component.color = 'error';
    expect(component.tagClass).toBe('tag-error');
  });

  it('should apply tag-default class for default color', () => {
    component.color = 'default';
    expect(component.tagClass).toBe('tag-default');
  });

  it('should show remove button when removable is true', () => {
    component.removable = true;
    fixture.detectChanges();
    const removeButton = fixture.nativeElement.querySelector('.tag-remove');
    expect(removeButton).toBeTruthy();
  });

  it('should not show remove button when removable is false', () => {
    component.removable = false;
    fixture.detectChanges();
    const removeButton = fixture.nativeElement.querySelector('.tag-remove');
    expect(removeButton).toBeNull();
  });

  it('should emit removed event when remove button is clicked', () => {
    component.removable = true;
    fixture.detectChanges();

    let emitted = false;
    component.removed.subscribe(() => {
      emitted = true;
    });

    const removeButton = fixture.nativeElement.querySelector('.tag-remove');
    removeButton.click();

    expect(emitted).toBe(true);
  });

  it('should project content correctly', () => {
    const testContent = 'Test Tag';
    const compiled = fixture.nativeElement;
    compiled.querySelector('.tag-content').textContent = testContent;
    expect(compiled.querySelector('.tag-content').textContent).toContain(testContent);
  });
});
