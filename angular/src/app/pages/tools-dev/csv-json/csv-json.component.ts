import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

type Direction = 'csv2json' | 'json2csv';

@Component({
  selector: 'app-csv-json',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './csv-json.component.html',
  styleUrls: ['./csv-json.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CsvJsonComponent {
  direction: Direction = 'csv2json';
  delimiter = ',';
  customDelimiter = ';';
  hasHeader = true;
  pretty = true;

  input = '';
  output = '';
  error = '';
  stats = '';

  constructor(private snackBar: MatSnackBar) {}

  get activeDelimiter(): string {
    if (this.delimiter === 'custom') return this.customDelimiter;
    if (this.delimiter === '\t') return '\t';
    return this.delimiter;
  }

  convert(): void {
    this.error = '';
    this.output = '';
    this.stats = '';
    if (!this.input.trim()) {
      this.error = 'Input kosong.';
      return;
    }
    try {
      if (this.direction === 'csv2json') {
        this.output = this.csvToJson(this.input, this.activeDelimiter, this.hasHeader, this.pretty);
      } else {
        this.output = this.jsonToCsv(this.input, this.activeDelimiter, this.hasHeader);
      }
      const rows = this.direction === 'csv2json'
        ? this.countCsvRows(this.input)
        : this.countJsonRows(this.input);
      this.stats = `${rows} baris data`;
    } catch (e) {
      this.error = 'Konversi gagal: ' + (e as Error).message;
    }
  }

  swap(): void {
    this.direction = this.direction === 'csv2json' ? 'json2csv' : 'csv2json';
    this.convert();
  }

  clear(): void {
    this.input = '';
    this.output = '';
    this.error = '';
    this.stats = '';
  }

  copyOutput(): void {
    if (!this.output) return;
    navigator.clipboard.writeText(this.output).then(() =>
      this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
    );
  }

  private csvToJson(csv: string, delim: string, header: boolean, pretty: boolean): string {
    const rows = this.parseCsv(csv, delim);
    if (rows.length === 0) return '[]';
    if (header) {
      const headers = rows[0].map((h) => h.trim());
      const out = rows.slice(1).map((r) => {
        const obj: Record<string, unknown> = {};
        headers.forEach((h, i) => {
          obj[h] = this.castValue(r[i] ?? '');
        });
        return obj;
      });
      return pretty ? JSON.stringify(out, null, 2) : JSON.stringify(out);
    }
    const out = rows.map((r) => r.map((c) => this.castValue(c)));
    return pretty ? JSON.stringify(out, null, 2) : JSON.stringify(out);
  }

  private jsonToCsv(json: string, delim: string, header: boolean): string {
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch {
      throw new Error('JSON tidak valid.');
    }
    const arr: Record<string, unknown>[] = Array.isArray(data)
      ? (data as Record<string, unknown>[])
      : [data as Record<string, unknown>];
    if (arr.length === 0) return '';
    const keys = this.collectKeys(arr);
    const esc = (v: unknown): string => {
      const s = v === null || v === undefined ? '' : String(v);
      const needs = s.includes(delim) || s.includes('"') || s.includes('\n') || s.includes('\r');
      return needs ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines: string[] = [];
    if (header) lines.push(keys.map((k) => esc(k)).join(delim));
    arr.forEach((row) => {
      lines.push(keys.map((k) => esc(row[k])).join(delim));
    });
    return lines.join('\n');
  }

  private parseCsv(text: string, delim: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    const d = delim;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === d) { row.push(field); field = ''; }
        else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (ch === '\r') { /* skip */ }
        else field += ch;
      }
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ''));
  }

  private castValue(v: string): unknown {
    if (v === '') return '';
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    return v;
  }

  private collectKeys(arr: Record<string, unknown>[]): string[] {
    const set = new Set<string>();
    arr.forEach((r) => Object.keys(r).forEach((k) => set.add(k)));
    return Array.from(set);
  }

  private countCsvRows(csv: string): number {
    const rows = this.parseCsv(csv, this.activeDelimiter);
    return this.hasHeader ? Math.max(0, rows.length - 1) : rows.length;
  }

  private countJsonRows(json: string): number {
    try {
      const d = JSON.parse(json);
      return Array.isArray(d) ? d.length : 1;
    } catch {
      return 0;
    }
  }
}
