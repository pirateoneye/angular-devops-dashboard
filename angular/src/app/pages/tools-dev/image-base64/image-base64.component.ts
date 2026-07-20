import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  dragOver = false;
  imgWidth = 0;
  imgHeight = 0;
  copiedVariant = '';

  private readonly snackBar = inject(MatSnackBar);

  onFile(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.error = '';
    this.fileName = file.name || 'image';
    this.size = this.fmt(file.size);
    const reader = new FileReader();
    reader.onload = () => {
      this.dataUrl = String(reader.result);
    };
    reader.onerror = () => {
      this.error = 'Gagal membaca file.';
    };
    reader.readAsDataURL(file);
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(): void {
    this.dragOver = false;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      this.error = 'Harap drop file gambar.';
      return;
    }
    this.error = '';
    this.fileName = file.name || 'image';
    this.size = this.fmt(file.size);
    this.imgWidth = 0;
    this.imgHeight = 0;
    const reader = new FileReader();
    reader.onload = () => {
      this.dataUrl = String(reader.result);
    };
    reader.onerror = () => {
      this.error = 'Gagal membaca file.';
    };
    reader.readAsDataURL(file);
  }

  async pasteFromClipboard(): Promise<void> {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageTypes = item.types.filter((t) => t.startsWith('image/'));
        if (imageTypes.length) {
          const blob = await item.getType(imageTypes[0]);
          this.fileName = 'clipboard.' + (imageTypes[0].split('/')[1] || 'png');
          this.size = this.fmt(blob.size);
          this.imgWidth = 0;
          this.imgHeight = 0;
          const reader = new FileReader();
          reader.onload = () => {
            this.dataUrl = String(reader.result);
          };
          reader.onerror = () => {
            this.error = 'Gagal membaca clipboard.';
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
      this.error = 'Clipboard tidak berisi gambar.';
    } catch {
      this.error = 'Gagal membaca clipboard (perlu izin).';
    }
  }

  onImageLoad(e: Event): void {
    const img = e.target as HTMLImageElement;
    this.imgWidth = img.naturalWidth;
    this.imgHeight = img.naturalHeight;
  }

  onUrlInput(): void {
    this.error = '';
    this.imgWidth = 0;
    this.imgHeight = 0;
    if (!this.dataUrl.startsWith('data:')) {
      this.error = 'Bukan data URL valid (harus diawali "data:...").';
      return;
    }
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
    navigator.clipboard
      .writeText(this.dataUrl)
      .then(() =>
        this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
      );
  }

  copyVariant(kind: string): void {
    if (!this.dataUrl) return;
    let text = '';
    switch (kind) {
      case 'datauri':
        text = this.dataUrl;
        break;
      case 'imgtag':
        text = `<img src="${this.dataUrl}" alt="" />`;
        break;
      case 'css':
        text = `background-image: url(${this.dataUrl});`;
        break;
      case 'markdown':
        text = `![](${this.dataUrl})`;
        break;
    }
    navigator.clipboard.writeText(text).then(() => {
      this.copiedVariant = kind;
      this.snackBar.open('Disalin', 'Close', { duration: 1500 });
      setTimeout(() => {
        this.copiedVariant = '';
      }, 2000);
    });
  }
}
