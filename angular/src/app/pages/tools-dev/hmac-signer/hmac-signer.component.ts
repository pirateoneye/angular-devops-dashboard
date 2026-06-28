import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as CryptoJS from 'crypto-js';

type HmacAlgo = 'HmacMD5' | 'HmacSHA1' | 'HmacSHA256' | 'HmacSHA512';
type Encoding = 'Hex' | 'Base64';

interface CryptoEncoder {
  Hex: { stringify: (w: unknown) => string };
  Base64: { stringify: (w: unknown) => string };
}
interface CryptoHmacResult {
  toString: (encoder?: unknown) => string;
}
type CryptoLib = Record<string, ((message: string, secret: string) => CryptoHmacResult) | CryptoEncoder | unknown>;

@Component({
  selector: 'app-hmac-signer',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatIconModule],
  templateUrl: './hmac-signer.component.html',
  styleUrls: ['./hmac-signer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HmacSignerComponent {
  message = '';
  secret = '';
  algo: HmacAlgo = 'HmacSHA256';
  encoding: Encoding = 'Hex';
  signature = '';

  // Verify side
  expected = '';
  verifyResult: '' | 'match' | 'mismatch' = '';

  constructor(private snackBar: MatSnackBar) {}

  compute(): string {
    if (!this.message || !this.secret) return '';
    const lib = CryptoJS as unknown as CryptoLib;
    const fn = lib[this.algo] as ((message: string, secret: string) => CryptoHmacResult) | undefined;
    if (typeof fn !== 'function') return '';
    const hmac = fn(this.message, this.secret);
    const enc = lib['enc'] as CryptoEncoder;
    return this.encoding === 'Base64'
      ? hmac.toString(enc['Base64'])
      : hmac.toString(enc['Hex']);
  }

  generate(): void {
    this.signature = this.compute();
    this.verifyResult = '';
  }

  verify(): void {
    const computed = this.compute();
    if (!computed || !this.expected) {
      this.verifyResult = '';
      return;
    }
    // Normalize whitespace + case-insensitive compare (hex/base64 are not case-sensitive in practice for hex).
    // Use a constant-time comparison so the verify path does not leak timing
    // information about the expected signature (avoids byte-by-byte short-circuit).
    const a = computed.trim().toLowerCase();
    const b = this.expected.trim().toLowerCase();
    this.verifyResult = constantTimeEquals(a, b) ? 'match' : 'mismatch';
  }

  copy(value: string): void {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() =>
      this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
    );
  }
}

/** Constant-time string comparison: walks the full length of both strings and
 *  accumulates XOR differences, so the runtime does not depend on where (or
 *  whether) the first mismatch occurs. Length differences are folded into the
 *  accumulator so total length is the only timing signal leaked. */
function constantTimeEquals(a: string, b: string): boolean {
  const la = a.length;
  const lb = b.length;
  const max = Math.max(la, lb);
  let diff = la ^ lb;
  for (let i = 0; i < max; i++) {
    const ca = i < la ? a.charCodeAt(i) : 0;
    const cb = i < lb ? b.charCodeAt(i) : 0;
    diff |= ca ^ cb;
  }
  return diff === 0;
}