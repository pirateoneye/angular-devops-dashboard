import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-image-base64',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './image-base64.component.html',
  styleUrls: ['./image-base64.component.css'],
})
export class ImageBase64Component {
  dataUrl = '';
  fileName = 'download.png';
  size = '';
  error = '';

  constructor(private snackBar: MatSnackBar) {}

  onFile(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.error = '';
    this.fileName = file.name || 'image';
    this.size = this.fmt(file.size);
    const reader = new FileReader();
    reader.onload = () => { this.dataUrl = String(reader.result); };
    reader.onerror = () => { this.error = 'Gagal membaca file.'; };
    reader.readAsDataURL(file);
  }

  onUrlInput(): void {
    this.error = '';
    if (!this.dataUrl.startsWith('data:')) { this.error = 'Bukan data URL valid (harus diawali "data:...").'; return; }
    const m = /^data:([^;]+);base64/.exec(this.dataUrl);
    const ext = m ? m[1].split('/')[1] : 'png';
    this.fileName = 'image.' + ext;
  }

  private fmt(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  get byteLength(): string {
    if (!this.dataUrl) return '';
    const b64 = this.dataUrl.split(',')[1] ?? '';
    const bytes = Math.floor((b64.length * 3) / 4);
    return this.fmt(bytes);
  }

  copy(): void {
    if (!this.dataUrl) return;
    navigator.clipboard.writeText(this.dataUrl).then(() =>
      this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
    );
  }
}