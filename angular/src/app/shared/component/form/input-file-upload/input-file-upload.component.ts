import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'input-file-upload',
  templateUrl: './input-file-upload.component.html',
  styleUrls: ['./input-file-upload.component.css'],
})
export class InputFileUploadComponent {
  file: File | null = null;
  progress: number = 0;
  event: string = 'idle';
  @Input() url: string;
  @Output() eventUploadFile = new EventEmitter<any>();

  // Menangani event drag over agar file dapat di-drop
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.event = 'onDragOver';
    // Anda dapat menambahkan kelas CSS untuk styling saat drag over
  }

  // Menangani event drag leave
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.event = 'onDragLeave';
    // Hapus kelas CSS jika diperlukan
  }

  // Menangani event drop
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.event = 'onDrop';
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.file = event.dataTransfer.files[0];
      event.dataTransfer.clearData();
    }
  }

  // Menangani pemilihan file melalui input
  onFileSelected(event: any) {
    this.event = 'onFileSelected';
    if (event.target.files && event.target.files.length > 0) {
      this.file = event.target.files[0];
    }
  }

  // Fungsi untuk meng-upload file dengan progress bar
  uploadFile() {
    if (!this.file) {
      alert('Pilih file terlebih dahulu!');
      return;
    }
    this.eventUploadFile.emit(this.file);
  }
}
