import {Component, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface Stats { min: number; max: number; avg: number; p50: number; p95: number; p99: number; count: number; values: number[]; }

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'app-latency-stats',
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="container pt-3 pb-3" style="max-width:680px">
      <mat-card class="tool-card">
        <h2 class="tool-title">Latency Stats</h2>
        <p class="tool-sub">Paste response time (ms), satu per baris — langsung hitung p50/p95/p99</p>
        <div class="tool-divider"></div>

        <div class="input-row">
          <textarea
            style="flex:1;height:180px;font-family:'SF Mono','Consolas',monospace;font-size:.82rem;padding:12px;border:1px solid var(--msv-border);border-radius:8px;resize:vertical;background:#fafbfc"
            placeholder="142&#10;89&#10;203&#10;156&#10;..."
            [(ngModel)]="raw"
          ></textarea>
          <div class="quick-actions">
            <button mat-icon-button (click)="pasteSample()" matTooltip="Paste sample data">
              <mat-icon>content_paste</mat-icon>
            </button>
            <button mat-icon-button (click)="raw.set('')" matTooltip="Clear">
              <mat-icon>clear</mat-icon>
            </button>
          </div>
        </div>

        @if (stats(); as s) {
          <div class="stats-grid">
            <div class="stat cell-big">
              <div class="label">Requests</div>
              <div class="val">{{ s.count }}</div>
            </div>
            <div class="stat cell-big">
              <div class="label">Avg</div>
              <div class="val">{{ s.avg | number:'1.0-1' }}<span class="unit">ms</span></div>
            </div>
            <div class="stat"><div class="label">Min</div><div class="val">{{ s.min | number:'1.0-1' }}<span class="unit">ms</span></div></div>
            <div class="stat"><div class="label">Max</div><div class="val">{{ s.max | number:'1.0-1' }}<span class="unit">ms</span></div></div>
            <div class="stat highlight"><div class="label">P50</div><div class="val">{{ s.p50 | number:'1.0-1' }}<span class="unit">ms</span></div></div>
            <div class="stat highlight"><div class="label">P95</div><div class="val">{{ s.p95 | number:'1.0-1' }}<span class="unit">ms</span></div></div>
            <div class="stat highlight"><div class="label">P99</div><div class="val">{{ s.p99 | number:'1.0-1' }}<span class="unit">ms</span></div></div>
          </div>

          @if (s.values.length <= 50) {
            <div class="sparkline">
              @for (v of s.values; track $index) {
                <div class="bar" [style.height]="(v / s.max * 100) + '%'" [title]="v + 'ms'"></div>
              }
            </div>
          }
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .tool-title { font-size:1.2rem;font-weight:700 }
    .tool-sub { font-size:.8rem;color:var(--msv-text-muted);margin-bottom:2px }
    .tool-divider { border-top:1px solid var(--msv-border);margin:14px 0 }
    .tool-card { padding:20px 24px }
    .input-row { display:flex;gap:12px;align-items:flex-start }
    .quick-actions { display:flex;flex-direction:column;gap:4px }
    .stats-grid { display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:16px }
    .stat { background:var(--msv-surface-2);border-radius:10px;padding:14px;text-align:center;border:1px solid var(--msv-border) }
    .stat.cell-big { background:var(--msv-accent-bg);border-color:var(--msv-primary) }
    .stat.highlight { border-left:3px solid var(--msv-primary) }
    .stat .label { font-size:.7rem;text-transform:uppercase;letter-spacing:.4px;color:var(--msv-text-muted);margin-bottom:2px }
    .stat .val { font-size:1.4rem;font-weight:700 }
    .stat .unit { font-size:.7rem;font-weight:400;color:var(--msv-text-muted);margin-left:2px }
    .sparkline { display:flex;align-items:flex-end;height:60px;gap:2px;margin-top:16px;padding:8px;background:var(--msv-surface-2);border-radius:8px;border:1px solid var(--msv-border) }
    .sparkline .bar { flex:1;min-width:2px;background:var(--msv-primary);border-radius:2px 2px 0 0;transition:height.2s }
  `]
})
export class LatencyStatsComponent {
  raw = signal('');

  stats = computed<Stats | null>(() => {
    const lines = this.raw().trim().split(/[\n,;\s]+/).filter(Boolean);
    const vals = lines.map(Number).filter(n => !isNaN(n) && n >= 0).sort((a,b) => a-b);
    if (vals.length === 0) return null;

    const count = vals.length;
    const min = vals[0];
    const max = vals[count - 1];
    const avg = vals.reduce((s,v) => s+v, 0) / count;

    const p = (pct: number) => {
      const idx = Math.ceil(pct / 100 * count) - 1;
      return vals[Math.max(0, idx)];
    };

    return { min, max, avg, p50: p(50), p95: p(95), p99: p(99), count, values: vals };
  });

  pasteSample() {
    this.raw.set(Array.from({length: 50}, () => Math.round(10 + Math.random() * 490)).join('\n'));
  }
}
