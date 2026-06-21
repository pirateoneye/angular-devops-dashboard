import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-text-transforms',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule],
  templateUrl: './text-transforms.component.html',
  styleUrls: ['./text-transforms.component.css'],
})
export class TextTransformsComponent {
  input = '';
  output = '';
  stats = '';

  constructor(private snackBar: MatSnackBar) {}

  private setOut(fn: (s: string) => string): void {
    this.output = fn(this.input);
    this.computeStats();
  }

  computeStats(): void {
    const chars = this.input.length;
    const words = this.input.trim() ? this.input.trim().split(/\s+/).length : 0;
    const lines = this.input ? this.input.split('\n').length : 0;
    this.stats = `${chars} char · ${words} kata · ${lines} baris`;
  }

  upper() { this.setOut((s) => s.toUpperCase()); }
  lower() { this.setOut((s) => s.toLowerCase()); }
  title() { this.setOut((s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())); }
  camel() { this.setOut((s) => s.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())); }
  snake() { this.setOut((s) => s.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()); }
  kebab() { this.setOut((s) => s.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()); }
  sortAsc() { this.setOut((s) => s.split('\n').sort((a, b) => a.localeCompare(b)).join('\n')); }
  sortDesc() { this.setOut((s) => s.split('\n').sort((a, b) => b.localeCompare(a)).join('\n')); }
  dedupe() { this.setOut((s) => Array.from(new Set(s.split('\n'))).join('\n')); }
  trimLines() { this.setOut((s) => s.split('\n').map((l) => l.trim()).join('\n')); }
  reverseLines() { this.setOut((s) => s.split('\n').reverse().join('\n')); }
  reverseText() { this.setOut((s) => [...s].reverse().join('')); }
  escapeHtml() { this.setOut((s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')); }
  unescapeHtml() { this.setOut((s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')); }
  escapeJson() { this.setOut((s) => JSON.stringify(s)); }
  removeBlank() { this.setOut((s) => s.split('\n').filter((l) => l.trim() !== '').join('\n')); }

  copy(): void {
    if (!this.output) return;
    navigator.clipboard.writeText(this.output).then(() =>
      this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
    );
  }

  clear(): void {
    this.input = '';
    this.output = '';
    this.stats = '';
  }
}