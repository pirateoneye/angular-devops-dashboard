import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsvAvatarComponent } from './msv-avatar.component';

describe('MsvAvatarComponent', () => {
  let component: MsvAvatarComponent;
  let fixture: ComponentFixture<MsvAvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsvAvatarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MsvAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display image when src is provided', () => {
    component.src = 'https://example.com/avatar.jpg';
    component.name = 'John Doe';
    fixture.detectChanges();

    const imgElement = fixture.nativeElement.querySelector('.avatar-image');
    expect(imgElement).toBeTruthy();
    expect(imgElement.src).toBe('https://example.com/avatar.jpg');
  });

  it('should display initials when no src provided', () => {
    component.name = 'John Doe';
    component.src = '';
    fixture.detectChanges();

    const initialsElement = fixture.nativeElement.querySelector('.avatar-initials');
    expect(initialsElement).toBeTruthy();
    expect(initialsElement.textContent.trim()).toBe('JD');
  });

  it('should display first letter for single name', () => {
    component.name = 'John';
    component.src = '';
    fixture.detectChanges();

    const initialsElement = fixture.nativeElement.querySelector('.avatar-initials');
    expect(initialsElement.textContent.trim()).toBe('J');
  });

  it('should fall back to initials on image error', () => {
    component.src = 'https://example.com/invalid.jpg';
    component.name = 'Jane Smith';
    fixture.detectChanges();

    const imgElement = fixture.nativeElement.querySelector('.avatar-image');
    expect(imgElement).toBeTruthy();

    component.onImageError();
    fixture.detectChanges();

    const initialsElement = fixture.nativeElement.querySelector('.avatar-initials');
    expect(initialsElement).toBeTruthy();
    expect(initialsElement.textContent.trim()).toBe('JS');
  });

  it('should apply small size class', () => {
    component.size = 'small';
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.avatar-container');
    expect(container.classList.contains('avatar-small')).toBe(true);
  });

  it('should apply medium size class by default', () => {
    const container = fixture.nativeElement.querySelector('.avatar-container');
    expect(container.classList.contains('avatar-medium')).toBe(true);
  });

  it('should apply large size class', () => {
    component.size = 'large';
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.avatar-container');
    expect(container.classList.contains('avatar-large')).toBe(true);
  });

  it('should apply circle shape class by default', () => {
    const container = fixture.nativeElement.querySelector('.avatar-container');
    expect(container.classList.contains('avatar-circle')).toBe(true);
  });

  it('should apply square shape class', () => {
    component.shape = 'square';
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.avatar-container');
    expect(container.classList.contains('avatar-square')).toBe(true);
  });

  it('should handle empty name gracefully', () => {
    component.name = '';
    component.src = '';
    fixture.detectChanges();

    const initialsElement = fixture.nativeElement.querySelector('.avatar-initials');
    expect(initialsElement.textContent.trim()).toBe('');
  });

  it('should handle name with multiple spaces', () => {
    component.name = 'John   Michael   Doe';
    component.src = '';
    fixture.detectChanges();

    const initialsElement = fixture.nativeElement.querySelector('.avatar-initials');
    expect(initialsElement.textContent.trim()).toBe('JD');
  });

  it('should compute initials correctly', () => {
    component.name = 'Alice Johnson';
    expect(component.initials).toBe('AJ');

    component.name = 'Bob';
    expect(component.initials).toBe('B');

    component.name = '';
    expect(component.initials).toBe('');
  });
});
