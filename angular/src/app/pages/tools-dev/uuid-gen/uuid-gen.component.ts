import {Component, signal, computed, inject, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Clipboard } from '@angular/cdk/clipboard';

// Crockford base32 alphabet for ULID
const BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function cryptoRandom(): number[] {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr);
}

function ulidEncodeTime(time: number): string {
  let str = '';
  for (let i = 0; i < 10; i++) {
    str = BASE32.charAt(time % 32) + str;
    time = Math.floor(time / 32);
  }
  return str;
}

function ulidEncodeRandom(): string {
  const bytes = cryptoRandom();
  let str = '';
  for (let i = 0; i < 10; i++) {
    str += BASE32.charAt(bytes[i] % 32);
  }
  return str;
}

function generateUlid(): string {
  return ulidEncodeTime(Date.now()) + ulidEncodeRandom();
}

function ulidTimestamp(ulid: string): string | null {
  const timePart = ulid.slice(0, 10).toUpperCase();
  let time = 0;
  for (let i = 0; i < 10; i++) {
    const idx = BASE32.indexOf(timePart[i]);
    if (idx === -1) return null;
    time = time * 32 + idx;
  }
  return new Date(time).toISOString();
}

function generateUuid4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (cryptoRandom()[0] / 256 * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush, standalone: true, selector: 'app-uuid-gen',
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule, MatSlideToggleModule],
  template: `
    <div class="container pt-3 pb-3" style="max-width:640px">
      <mat-card class="tool-card"><h2 class="tool-title">UUID / ULID Generator</h2>
        <p class="tool-sub">Bulk generate UUID v4 & ULID. Decode ULID timestamp.</p><div class="tool-divider"></div>

        <div class="bar"><mat-form-field appearance="outline" style="width:120px"><mat-label>Count</mat-label>
          <input matInput type="number" [(ngModel)]="count" min="1" max="200"></mat-form-field>
          <button mat-raised-button color="primary" (click)="generate()"><mat-icon>auto_awesome</mat-icon> Generate</button>
          <button mat-stroked-button (click)="toggleMode()">{{ mode() === 'uuid' ? '← ULID' : '← UUID' }}</button>
        </div>

        @if (items().length > 0) {
          <div class="preview-section"><div class="preview-header">
            <span>{{ items().length }} {{ mode() === 'uuid' ? 'UUIDv4' : 'ULID' }} generated</span>
            <button mat-icon-button (click)="copyAll()" matTooltip="Copy all"><mat-icon>content_copy</mat-icon></button>
          </div>
          <pre class="output"><code>{{ items().join('\n') }}</code></pre></div>
        }

        @if (decodeInput().trim().length >= 26) {
          <div class="preview-section"><div class="preview-header"><span>Decoded timestamp</span></div>
            <div class="decode-result">{{ decodeResult() }}</div></div>
        }

        <div class="tool-divider"></div>
        <mat-form-field appearance="outline" style="width:100%"><mat-label>ULID to decode</mat-label>
          <input matInput [(ngModel)]="decodeInput" placeholder="01ARZ3NDEKTSV4RRFFQ69G5FAV"></mat-form-field>
      </mat-card></div>
  `, styles: [`
    .tool-title{font-size:1.2rem;font-weight:700}.tool-sub{font-size:.8rem;color:var(--msv-text-muted);margin-bottom:2px}
    .tool-divider{border-top:1px solid var(--msv-border);margin:14px 0}.tool-card{padding:20px 24px}
    .bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    .preview-section{margin-top:12px;border:1px solid var(--msv-border);border-radius:8px;overflow:hidden}
    .preview-header{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:var(--msv-surface-2);border-bottom:1px solid var(--msv-border);font-size:.78rem;color:var(--msv-text-muted)}
    .output{padding:12px 16px;margin:0;font-family:'SF Mono','Consolas',monospace;font-size:.78rem;line-height:1.6;max-height:300px;overflow-y:auto;white-space:pre;background:var(--msv-surface)}
    .decode-result{padding:12px 16px;font-size:.85rem;font-family:'SF Mono','Consolas',monospace;background:var(--msv-surface)}
  `]
})
export class UuidGenComponent {
  private snack = inject(MatSnackBar); private clipboard = inject(Clipboard);
  mode = signal<'uuid' | 'ulid'>('uuid'); count = signal(10);
  items = signal<string[]>([]); decodeInput = signal('');

  decodeResult = computed(() => {
    const u = this.decodeInput().trim();
    if (u.length < 26) return 'Paste a 26-char ULID to decode...';
    const ts = ulidTimestamp(u);
    return ts ? `Timestamp: ${ts} (${new Date(ts).toLocaleString('id-ID')})` : 'Invalid ULID';
  });

  generate() { const n = Math.min(Math.max(this.count()||1,1),200); this.items.set(Array.from({length:n},()=>this.mode()==='uuid'?generateUuid4():generateUlid())); }
  toggleMode() { this.mode.update(m=>m==='uuid'?'ulid':'uuid'); }
  copyAll() { const t=this.items().join('\n'); if(t){this.clipboard.copy(t);this.snack.open('Copied '+this.items().length+' items','Dismiss',{duration:2000});} }
}
