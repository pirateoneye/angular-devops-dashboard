import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';

interface CronField { label: string; min: number; max: number; }
interface FieldResult { values: number[] | null; desc: string; }

@Component({
  selector: 'app-cron-explainer',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule],
  templateUrl: './cron-explainer.component.html',
  styleUrls: ['./cron-explainer.component.css'],
})
export class CronExplainerComponent {
  expr = '*/5 * * * *';
  error = '';
  human = '';
  detail: { label: string; desc: string }[] = [];
  nextRun = '';

  private fields: CronField[] = [
    { label: 'Minute', min: 0, max: 59 },
    { label: 'Hour', min: 0, max: 23 },
    { label: 'Day of month', min: 1, max: 31 },
    { label: 'Month', min: 1, max: 12 },
    { label: 'Day of week', min: 0, max: 7 },
  ];

  constructor() { this.explain(); }

  explain(): void {
    this.error = '';
    this.detail = [];
    this.human = '';
    this.nextRun = '';
    const parts = this.expr.trim().split(/\s+/);
    if (parts.length !== 5) { this.error = 'Cron butuh 5 field: minute hour day-of-month month day-of-week'; return; }
    const results: FieldResult[] = [];
    for (let i = 0; i < 5; i++) {
      try {
        const r = this.parseField(parts[i], this.fields[i].min, this.fields[i].max);
        results.push(r);
        this.detail.push({ label: this.fields[i].label, desc: r.desc });
      } catch (e) {
        this.error = `Field ke-${i + 1} ("${parts[i]}") tidak valid: ${(e as Error).message}`;
        return;
      }
    }
    this.human = this.buildSentence(results);
    this.nextRun = this.nextOccurrence(results) ?? '(tidak ditemukan dalam 7 hari)';
  }

  private parseField(expr: string, min: number, max: number): FieldResult {
    if (expr === '*') return { values: null, desc: 'setiap nilai' };
    const vals = new Set<number>();
    let desc = '';
    for (const part of expr.split(',')) {
      const stepMatch = /^(\*|\d+-\d+)\/(\d+)$/.exec(part);
      let base: number[] = [];
      if (part === '*') {
        base = this.range(min, max);
      } else if (stepMatch) {
        const range = stepMatch[1];
        const step = +stepMatch[2];
        if (range === '*') base = this.range(min, max);
        else {
          const [a, b] = range.split('-').map(Number);
          base = this.range(a, b);
        }
        base = base.filter((_, i) => i % step === 0);
      } else if (/^\d+-\d+$/.test(part)) {
        const [a, b] = part.split('-').map(Number);
        base = this.range(a, b);
      } else if (/^\d+$/.test(part)) {
        base = [+part];
      } else {
        throw new Error(`format tidak dikenal "${part}"`);
      }
      for (const v of base) {
        let vv = v;
        if (min === 0 && max === 7 && vv === 7) vv = 0; // Sunday
        if (vv < min || vv > max) throw new Error(`nilai ${v} di luar ${min}-${max}`);
        vals.add(vv);
      }
    }
    const sorted = Array.from(vals).sort((a, b) => a - b);
    desc = sorted.join(', ');
    return { values: sorted, desc };
  }

  private range(a: number, b: number): number[] {
    const out: number[] = [];
    for (let i = a; i <= b; i++) out.push(i);
    return out;
  }

  private buildSentence(r: FieldResult[]): string {
    const [m, h, dom, mon, dow] = r;
    const minuteTxt = m.values === null ? 'setiap menit' : `menit ${m.desc}`;
    const hourTxt = h.values === null ? 'setiap jam' : `jam ${h.desc}`;
    const domTxt = dom.values === null ? 'setiap tanggal' : `tanggal ${dom.desc}`;
    const monTxt = mon.values === null ? 'setiap bulan' : `bulan ${mon.desc}`;
    const dowTxt = dow.values === null ? '' : `hari ke-${dow.desc}`;
    return `Berjalan ${minuteTxt}, ${hourTxt}, ${domTxt}, ${monTxt}${dowTxt ? ', ' + dowTxt : ''}.`;
  }

  private nextOccurrence(r: FieldResult[]): string | null {
    const inSet = (v: number, f: FieldResult) => f.values === null || f.values.includes(v);
    const start = new Date();
    start.setSeconds(0, 0);
    start.setMinutes(start.getMinutes() + 1);
    for (let i = 0; i < 10080; i++) { // 7 days
      const d = new Date(start.getTime() + i * 60000);
      if (inSet(d.getMinutes(), r[0]) && inSet(d.getHours(), r[1]) &&
          inSet(d.getDate(), r[2]) && inSet(d.getMonth() + 1, r[3]) &&
          inSet(d.getDay(), r[4])) {
        return d.toLocaleString();
      }
    }
    return null;
  }
}