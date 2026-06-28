import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-base-converter',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatIconModule],
  templateUrl: './base-converter.component.html',
  styleUrls: ['./base-converter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseConverterComponent implements OnInit {
  input = '255';
  fromBase = 10;
  bin = '';
  oct = '';
  dec = '';
  hex = '';
  error = '';

  bases = [
    { value: 2, label: 'Binary (2)' },
    { value: 8, label: 'Octal (8)' },
    { value: 10, label: 'Decimal (10)' },
    { value: 16, label: 'Hex (16)' },
  ];

  constructor(private snackBar: MatSnackBar) {}

  convert(): void {
    this.error = '';
    const raw = this.input.trim();
    if (!raw) {
      this.bin = this.oct = this.dec = this.hex = '';
      return;
    }
    let neg = false;
    let s = raw;
    if (s.startsWith('-')) { neg = true; s = s.slice(1); }
    const valid = '0-9a-fA-F';
    const re = new RegExp(`^[${valid}]+$`);
    if (!re.test(s) || (this.fromBase === 2 && /[^01]/.test(s)) || (this.fromBase === 8 && /[^0-7]/.test(s))) {
      this.error = `Input tidak valid untuk base ${this.fromBase}.`;
      this.bin = this.oct = this.dec = this.hex = '';
      return;
    }
    try {
      let big = BigInt(0);
      const b = BigInt(this.fromBase);
      for (const ch of s.toLowerCase()) {
        big = big * b + BigInt(parseInt(ch, 16));
      }
      if (neg) big = -big;
      const sign = big < 0n ? '-' : '';
      const abs = big < 0n ? -big : big;
      this.bin = sign + abs.toString(2);
      this.oct = sign + abs.toString(8);
      this.dec = sign + abs.toString(10);
      this.hex = sign + abs.toString(16).toUpperCase();
    } catch (e) {
      this.error = 'Konversi gagal: ' + (e as Error).message;
    }
  }

  ngOnInit(): void { this.convert(); }

  copy(value: string): void {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() =>
      this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
    );
  }
}