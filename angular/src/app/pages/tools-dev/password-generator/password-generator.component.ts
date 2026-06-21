import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-password-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatSlideToggleModule],
  templateUrl: './password-generator.component.html',
  styleUrls: ['./password-generator.component.css'],
})
export class PasswordGeneratorComponent {
  length = 20;
  count = 5;
  useUpper = true;
  useLower = true;
  useDigits = true;
  useSymbols = true;
  excludeAmbiguous = false;
  passwords: string[] = [];

  private sets = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.<>?/',
  };
  private ambiguous = 'Il1O0o';

  constructor(private snackBar: MatSnackBar) {}

  generate(): void {
    let pool = '';
    if (this.useUpper) pool += this.sets.upper;
    if (this.useLower) pool += this.sets.lower;
    if (this.useDigits) pool += this.sets.digits;
    if (this.useSymbols) pool += this.sets.symbols;
    if (this.excludeAmbiguous) pool = pool.replace(/[Il1O0o]/g, '');
    if (!pool) {
      this.passwords = [];
      return;
    }
    const n = Math.max(1, Math.min(50, this.count || 1));
    const len = Math.max(4, Math.min(128, this.length || 20));
    const arr = new Uint32Array(len);
    this.passwords = [];
    for (let i = 0; i < n; i++) {
      crypto.getRandomValues(arr);
      let pwd = '';
      for (let k = 0; k < len; k++) pwd += pool[arr[k] % pool.length];
      this.passwords.push(pwd);
    }
  }

  copy(value: string): void {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() =>
      this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
    );
  }

  strength(pwd: string): { label: string; pct: number } {
    if (!pwd) return { label: '-', pct: 0 };
    let score = 0;
    if (pwd.length >= 12) score += 25;
    if (pwd.length >= 20) score += 15;
    if (/[a-z]/.test(pwd)) score += 15;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 15;
    score = Math.min(100, score);
    const label = score >= 80 ? 'Kuat' : score >= 50 ? 'Sedang' : 'Lemah';
    return { label, pct: score };
  }
}