import { Component, Input } from '@angular/core';

@Component({
  selector: 'msv-avatar',
  templateUrl: './msv-avatar.component.html',
  styleUrls: ['./msv-avatar.component.css'],
})
export class MsvAvatarComponent {
  @Input() src: string = '';
  @Input() name: string = '';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() shape: 'circle' | 'square' = 'circle';

  imageError: boolean = false;

  get showImage(): boolean {
    return !!this.src && !this.imageError;
  }

  get initials(): string {
    if (!this.name) return '';
    
    const names = this.name.trim().split(/\s+/);
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  get sizeClass(): string {
    return `avatar-${this.size}`;
  }

  get shapeClass(): string {
    return `avatar-${this.shape}`;
  }

  onImageError(): void {
    this.imageError = true;
  }
}
