import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-color-converter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './color-converter.component.html',
  styleUrls: ['./color-converter.component.css'],
})
export class ColorConverterComponent {
  hex = '#005caa';
  r = 0;
  g = 92;
  b = 170;
  h = 0;
  s = 0;
  l = 0;
  error = '';

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.fromHex();
  }

  onPicker(event: Event): void {
    this.hex = (event.target as HTMLInputElement).value;
    this.fromHex();
  }

  fromHex(): void {
    this.error = '';
    const m = /^#?([0-9a-fA-F]{6})$/.exec(this.hex.trim());
    if (!m) {
      this.error = 'Hex tidak valid (contoh: #005caa).';
      return;
    }
    const v = m[1];
    this.r = parseInt(v.slice(0, 2), 16);
    this.g = parseInt(v.slice(2, 4), 16);
    this.b = parseInt(v.slice(4, 6), 16);
    this.rgbToHsl();
  }

  fromRgb(): void {
    this.error = '';
    this.r = this.clamp(this.r);
    this.g = this.clamp(this.g);
    this.b = this.clamp(this.b);
    this.hex = '#' + [this.r, this.g, this.b].map((x) => x.toString(16).padStart(2, '0')).join('');
    this.rgbToHsl();
  }

  fromHsl(): void {
    this.error = '';
    this.hslToRgb();
    this.hex = '#' + [this.r, this.g, this.b].map((x) => x.toString(16).padStart(2, '0')).join('');
  }

  private clamp(v: number): number {
    return Math.max(0, Math.min(255, Math.round(v) || 0));
  }

  private rgbToHsl(): void {
    const r = this.r / 255, g = this.g / 255, b = this.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h /= 6;
    }
    this.h = Math.round(h * 360);
    this.s = Math.round(s * 100);
    this.l = Math.round(l * 100);
  }

  private hslToRgb(): void {
    const h = this.h / 360, s = this.s / 100, l = this.l / 100;
    let r: number, g: number, b: number;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    this.r = Math.round(r * 255);
    this.g = Math.round(g * 255);
    this.b = Math.round(b * 255);
  }

  get rgbStr(): string { return `rgb(${this.r}, ${this.g}, ${this.b})`; }
  get hslStr(): string { return `hsl(${this.h}, ${this.s}%, ${this.l}%)`; }

  copy(value: string): void {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() =>
      this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
    );
  }
}