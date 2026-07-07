import {
  Component,
  ChangeDetectionStrategy,
  computed,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { KJUR, KEYUTIL } from 'jsrsasign';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  headerJson: string;
  payloadJson: string;
  alg: string;
}

interface ExpiryInfo {
  iat?: string;
  nbf?: string;
  exp?: string;
  status: 'valid' | 'expired' | 'not-yet-valid' | 'no-expiry';
  statusLabel: string;
}

@Component({
  selector: 'app-jwt-debugger',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatIconModule],
  templateUrl: './jwt-debugger.component.html',
  styleUrls: ['./jwt-debugger.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JwtDebuggerComponent {
  token = '';
  decoded: DecodedJwt | null = null;
  expiry: ExpiryInfo | null = null;
  error = '';

  // Signature verify side
  verifyKey = '';
  verified: 'ok' | 'fail' | '' = '';
  verifyError = '';

  // Syntax-highlighted outputs
  headerHtml: SafeHtml = '';
  payloadHtml: SafeHtml = '';

  // JWT segment colors
  headerColor = '#ef4444';
  payloadColor = '#3b82f6';
  sigColor = '#22c55e';

  // ponytail: computed signal to avoid @let in template (Angular 17 limitation)
  segmentParts = computed(() => this.token.trim().split('.'));

  constructor(
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
  ) {}

  @HostListener('execute') onExecute(): void {
    this.decode();
  }

  autoMode = false;
  private debounceTimer: any = null;

  onTokenChange(): void {
    if (!this.autoMode) return;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.decode(), 200);
  }

  onTokenPaste(): void {
    if (!this.autoMode) return;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.decode(), 200);
  }

  private b64urlDecode(s: string): string {
    const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
    try {
      return decodeURIComponent(
        atob(b64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
    } catch {
      return atob(b64);
    }
  }

  private pretty(obj: unknown): string {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }

  private fmtClaim(v: unknown): string | undefined {
    if (v === undefined || v === null) return undefined;
    if (typeof v === 'number') {
      if (v > 1e9 && v < 1e12) return new Date(v * 1000).toISOString();
    }
    return String(v);
  }

  /** Colorize JSON keys/values via simple regex tokenizer. */
  colorizeJson(json: string): SafeHtml {
    const escaped = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const colored = escaped
      .replace(/("(?:\\.|[^"\\])*")\s*:/g, '<span class="jwt-key">$1</span>:')
      .replace(
        /:\s*("(?:\\.|[^"\\])*")/g,
        ': <span class="jwt-string">$1</span>',
      )
      .replace(
        /:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g,
        ': <span class="jwt-number">$1</span>',
      )
      .replace(/:\s*(true|false)/g, ': <span class="jwt-bool">$1</span>')
      .replace(/:\s*(null)/g, ': <span class="jwt-null">$1</span>');
    return this.sanitizer.bypassSecurityTrustHtml(colored);
  }

  decode(): void {
    this.decoded = null;
    this.expiry = null;
    this.error = '';
    this.verified = '';
    this.verifyError = '';
    this.headerHtml = '';
    this.payloadHtml = '';

    const raw = this.token.trim();
    if (!raw) return;
    const parts = raw.split('.');
    if (parts.length < 2) {
      this.error =
        'Token tidak valid: butuh minimal 2 segmen (header.payload.signature).';
      return;
    }
    try {
      const header = JSON.parse(this.b64urlDecode(parts[0]));
      const payload = JSON.parse(this.b64urlDecode(parts[1]));
      const alg = (header?.alg as string) || '(tidak ada alg)';
      const headerJson = this.pretty(header);
      const payloadJson = this.pretty(payload);
      this.decoded = {
        header,
        payload,
        headerJson,
        payloadJson,
        alg,
      };
      this.expiry = this.buildExpiry(payload);
      this.headerHtml = this.colorizeJson(headerJson);
      this.payloadHtml = this.colorizeJson(payloadJson);
    } catch (e) {
      this.error =
        'Gagal decode: ' + (e instanceof Error ? e.message : String(e));
    }
  }

  private buildExpiry(payload: Record<string, unknown>): ExpiryInfo {
    const now = Math.floor(Date.now() / 1000);
    const iat = this.fmtClaim(payload['iat']);
    const nbf = this.fmtClaim(payload['nbf']);
    const exp = this.fmtClaim(payload['exp']);
    const expNum = payload['exp'] as number | undefined;
    const nbfNum = payload['nbf'] as number | undefined;

    let status: ExpiryInfo['status'] = 'no-expiry';
    let statusLabel = 'Tidak ada klaim exp';
    if (nbfNum && now < nbfNum) {
      status = 'not-yet-valid';
      statusLabel = 'Belum berlaku (nbf di masa depan)';
    } else if (expNum === undefined) {
      status = 'no-expiry';
    } else if (now >= expNum) {
      status = 'expired';
      statusLabel = 'Token sudah kadaluarsa';
    } else {
      status = 'valid';
      statusLabel = 'Token masih berlaku';
    }
    return { iat, nbf, exp, status, statusLabel };
  }

  verify(): void {
    this.verified = '';
    this.verifyError = '';
    const raw = this.token.trim();
    if (!raw || !this.verifyKey) return;
    const alg = this.decoded?.alg;
    if (!alg || alg === '(tidak ada alg)') {
      this.verifyError = 'Decode dulu untuk membaca alg dari header.';
      return;
    }
    try {
      const key = alg.startsWith('HS')
        ? this.verifyKey
        : KEYUTIL.getKey(this.verifyKey);
      const ok = KJUR.jws.JWS.verify(raw, key, [alg]);
      this.verified = ok ? 'ok' : 'fail';
    } catch (e) {
      this.verifyError =
        'Verifikasi gagal: ' + (e instanceof Error ? e.message : String(e));
    }
  }

  tryExample(): void {
    this.token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    this.decode();
  }

  copy(value: string): void {
    if (!value) return;
    navigator.clipboard
      .writeText(value)
      .then(() =>
        this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
      );
  }
}
