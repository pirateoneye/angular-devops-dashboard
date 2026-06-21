import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

type Mode = 'base64' | 'url' | 'jwt';

@Component({
  selector: 'app-decoder',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './decoder.component.html',
  styleUrls: ['./decoder.component.css'],
})
export class DecoderComponent {
  mode: Mode = 'base64';
  input = '';
  output = '';
  error = '';

  modes: { key: Mode; label: string }[] = [
    { key: 'base64', label: 'Base64' },
    { key: 'url', label: 'URL' },
    { key: 'jwt', label: 'JWT' },
  ];

  constructor(private snackBar: MatSnackBar) {}

  encode(): void {
    this.error = '';
    try {
      switch (this.mode) {
        case 'base64':
          this.output = btoa(unescape(encodeURIComponent(this.input)));
          break;
        case 'url':
          this.output = encodeURIComponent(this.input);
          break;
        case 'jwt':
          this.error = 'JWT tidak punya "encode" — gunakan Decode.';
          break;
      }
    } catch (e) {
      this.error = 'Encode gagal: ' + (e as Error).message;
    }
  }

  decode(): void {
    this.error = '';
    this.output = '';
    if (!this.input.trim()) return;
    try {
      switch (this.mode) {
        case 'base64':
          this.output = decodeURIComponent(escape(atob(this.input.trim())));
          break;
        case 'url':
          this.output = decodeURIComponent(this.input);
          break;
        case 'jwt':
          this.output = this.decodeJwt(this.input.trim());
          break;
      }
    } catch (e) {
      this.error = 'Decode gagal: ' + (e as Error).message;
    }
  }

  private decodeJwt(token: string): string {
    const parts = token.split('.');
    if (parts.length < 2) throw new Error('Format JWT tidak valid (butuh header.payload.signature).');
    const decodeB64Url = (s: string) => {
      const pad = s.length % 4 === 0 ? s : s + '='.repeat(4 - (s.length % 4));
      const b64 = pad.replace(/-/g, '+').replace(/_/g, '/');
      return decodeURIComponent(escape(atob(b64)));
    };
    const header = JSON.parse(decodeB64Url(parts[0]));
    const payload = JSON.parse(decodeB64Url(parts[1]));
    const result: Record<string, unknown> = { header, payload };
    if (payload && typeof payload === 'object' && 'exp' in payload) {
      const exp = (payload as { exp: number }).exp;
      result['expiry'] = {
        unix: exp,
        date: new Date(exp * 1000).toISOString(),
        expired: Date.now() > exp * 1000,
      };
    }
    return JSON.stringify(result, null, 2);
  }

  copyOutput(): void {
    if (!this.output) return;
    navigator.clipboard.writeText(this.output).then(() =>
      this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
    );
  }

  clear(): void {
    this.input = '';
    this.output = '';
    this.error = '';
  }
}