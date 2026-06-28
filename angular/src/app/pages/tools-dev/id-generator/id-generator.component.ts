import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-id-generator',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './id-generator.component.html',
  styleUrls: ['./id-generator.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    // RFC4122 v4 fallback using a cryptographically-secure RNG.
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Set version (4) and variant (RFC 4122 / 10xx) bits.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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