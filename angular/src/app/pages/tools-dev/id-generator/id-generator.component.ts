import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-id-generator',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './id-generator.component.html',
  styleUrls: ['./id-generator.component.css'],
})
export class IdGeneratorComponent {
  uuid = '';
  uuidCount = 5;
  uuids: string[] = [];

  nowMs = 0;
  nowSec = 0;
  nowIso = '';
  nowLocal = '';

  constructor(private snackBar: MatSnackBar) {
    this.refreshTime();
    this.generate();
  }

  private uuidv4(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // RFC4122 v4 fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  generate(): void {
    this.uuids = [];
    const n = Math.max(1, Math.min(50, this.uuidCount || 1));
    for (let i = 0; i < n; i++) this.uuids.push(this.uuidv4());
    if (this.uuids.length) this.uuid = this.uuids[0];
  }

  refreshTime(): void {
    const d = new Date();
    this.nowMs = d.getTime();
    this.nowSec = Math.floor(this.nowMs / 1000);
    this.nowIso = d.toISOString();
    this.nowLocal = d.toLocaleString();
  }

  copy(value: string | number): void {
    if (!value) return;
    navigator.clipboard.writeText(String(value)).then(() =>
      this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
    );
  }
}