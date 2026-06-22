import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Param { key: string; value: string; }

@Component({
  selector: 'app-url-parser',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './url-parser.component.html',
  styleUrls: ['./url-parser.component.css'],
})
export class UrlParserComponent {
  input = 'https://user:pass@example.com:8443/path/to/page?foo=bar&baz=42&q=hello+world#section-1';
  error = '';

  constructor(private snackBar: MatSnackBar) {}

  get parsed(): URL | null {
    if (!this.input.trim()) return null;
    try {
      return new URL(this.input.trim());
    } catch {
      return null;
    }
  }

  get components(): { label: string; value: string }[] {
    const u = this.parsed;
    if (!u) return [];
    return [
      { label: 'Protocol', value: u.protocol.replace(':', '') },
      { label: 'Username', value: u.username || '-' },
      { label: 'Password', value: u.password ? '••••' : '-' },
      { label: 'Host', value: u.hostname },
      { label: 'Port', value: u.port || (u.protocol === 'https:' ? '443 (default)' : u.protocol === 'http:' ? '80 (default)' : '-') },
      { label: 'Origin', value: u.origin },
      { label: 'Path', value: u.pathname || '/' },
      { label: 'Query', value: u.search || '-' },
      { label: 'Hash', value: u.hash || '-' },
    ];
  }

  get params(): Param[] {
    const u = this.parsed;
    if (!u) return [];
    const out: Param[] = [];
    u.searchParams.forEach((value: string, key: string) => out.push({ key, value }));
    return out;
  }

  parse(): void {
    if (!this.input.trim()) {
      this.error = 'Masukkan URL terlebih dahulu.';
      return;
    }
    this.error = this.parsed ? '' : 'URL tidak valid.';
    if (!this.error) this.snackBar.open('URL di-parse', 'Close', { duration: 1200 });
  }

  copyValue(v: string): void {
    if (!v || v === '-') return;
    navigator.clipboard.writeText(v).then(() =>
      this.snackBar.open('Disalin', 'Close', { duration: 1200 }),
    );
  }

  clear(): void {
    this.input = '';
    this.error = '';
  }
}
