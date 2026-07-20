import {
  Component,
  ChangeDetectionStrategy,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-timestamp-converter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './timestamp-converter.component.html',
  styleUrls: ['./timestamp-converter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimestampConverterComponent {
  /** Seconds input (unix). */
  unixInput = '';
  /** Human date input (ISO or any parseable). */
  dateInput = '';
  unit: 's' | 'ms' = 's';

  nowSec = 0;
  nowMs = 0;
  nowIso = '';
  nowUtc = '';

  outUnixSec = '';
  outUnixMs = '';
  outIso = '';
  outUtc = '';
  outLocal = '';
  outRelative = '';

  error = '';

  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    this.refreshNow();
  }

  @HostListener('execute') onExecute(): void {
    this.fromUnix();
  }

  refreshNow(): void {
    this.error = '';
    const now = new Date();
    this.nowSec = Math.floor(now.getTime() / 1000);
    this.nowMs = now.getTime();
    this.nowIso = now.toISOString();
    this.nowUtc = now.toUTCString();
  }

  fromUnix(): void {
    this.error = '';
    this.outUnixSec = '';
    this.outUnixMs = '';
    this.outIso = '';
    this.outUtc = '';
    this.outLocal = '';
    this.outRelative = '';

    const raw = this.unixInput.trim();
    if (!raw) {
      this.error = 'Masukkan angka timestamp.';
      return;
    }
    const num = Number(raw);
    if (!Number.isFinite(num)) {
      this.error = 'Input bukan angka yang valid.';
      return;
    }
    // Auto-detect ms vs s when unit = s but value looks like ms.
    const ms = this.unit === 'ms' ? num : this.guessMs(num);
    if (ms < 0) {
      this.error = 'Timestamp negatif / di luar jangkauan.';
      return;
    }
    const d = new Date(ms);
    if (isNaN(d.getTime())) {
      this.error = 'Tidak bisa dikonversi menjadi tanggal.';
      return;
    }
    this.outUnixSec = String(Math.floor(ms / 1000));
    this.outUnixMs = String(ms);
    this.outIso = d.toISOString();
    this.outUtc = d.toUTCString();
    this.outLocal = d.toLocaleString();
    this.outRelative = this.relative(ms);
  }

  fromDate(): void {
    this.error = '';
    this.outUnixSec = '';
    this.outUnixMs = '';
    this.outIso = '';
    this.outUtc = '';
    this.outLocal = '';
    this.outRelative = '';

    const raw = this.dateInput.trim();
    if (!raw) {
      this.error = 'Masukkan tanggal (ISO / YYYY-MM-DD HH:mm:ss / RFC).';
      return;
    }
    const d =
      raw.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(raw)
        ? new Date(raw + 'T00:00:00Z')
        : new Date(raw);
    if (isNaN(d.getTime())) {
      this.error = 'Format tanggal tidak dikenali.';
      return;
    }
    const ms = d.getTime();
    this.outUnixSec = String(Math.floor(ms / 1000));
    this.outUnixMs = String(ms);
    this.outIso = d.toISOString();
    this.outUtc = d.toUTCString();
    this.outLocal = d.toLocaleString();
    this.outRelative = this.relative(ms);
  }

  useNow(): void {
    this.unixInput = String(Date.now());
    this.unit = 'ms';
    this.fromUnix();
  }

  private guessMs(num: number): number {
    // If seconds value would be year < 1970 or > 2286, assume it's ms.
    const asSec = num * 1000;
    const year = new Date(asSec).getUTCFullYear();
    return year < 1970 || year > 2286 ? num : asSec;
  }

  private relative(ms: number): string {
    const diff = ms - Date.now();
    const abs = Math.abs(diff);
    const sec = Math.round(abs / 1000);
    const min = Math.round(sec / 60);
    const hr = Math.round(min / 60);
    const day = Math.round(hr / 24);
    let human: string;
    if (sec < 60) human = `${sec} detik`;
    else if (min < 60) human = `${min} menit`;
    else if (hr < 24) human = `${hr} jam`;
    else if (day < 30) human = `${day} hari`;
    else if (day < 365) human = `${Math.round(day / 30)} bulan`;
    else human = `${Math.round(day / 365)} tahun`;
    return diff >= 0 ? `${human} lagi` : `${human} lalu`;
  }

  copy(value: string): void {
    if (!value) return;
    navigator.clipboard
      .writeText(value)
      .then(() => this.snackBar.open('Disalin', 'Close', { duration: 1500 }));
  }
}
