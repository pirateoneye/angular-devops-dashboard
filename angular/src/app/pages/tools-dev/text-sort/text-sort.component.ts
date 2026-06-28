import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

type SortMode = 'asc' | 'desc' | 'natural-asc' | 'natural-desc' | 'length-asc' | 'length-desc' | 'shuffle';

@Component({
  selector: 'app-text-sort',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './text-sort.component.html',
  styleUrls: ['./text-sort.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextSortComponent {
  input = '';
  output = '';
  error = '';
  stats = '';

  mode: SortMode = 'asc';
  caseSensitive = false;
  dedupe = false;
  trimLines = true;
  removeBlank = true;

  constructor(private snackBar: MatSnackBar) {}

  process(): void {
    this.error = '';
    this.output = '';
    this.stats = '';
    if (!this.input.trim()) {
      this.error = 'Input kosong.';
      return;
    }
    let lines = this.input.split(/\r?\n/);
    if (this.trimLines) lines = lines.map((l) => l.trim());
    if (this.removeBlank) lines = lines.filter((l) => l.length > 0);

    const cmp = this.buildCompare();
    switch (this.mode) {
      case 'shuffle':
        lines = this.shuffle(lines);
        break;
      default:
        lines = lines.sort(cmp);
    }

    const beforeCount = lines.length;
    if (this.dedupe) {
      const seen = new Set<string>();
      lines = lines.filter((l) => {
        const key = this.caseSensitive ? l : l.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    this.output = lines.join('\n');
    const removed = beforeCount - lines.length;
    this.stats = `${lines.length} baris` + (removed > 0 ? ` (hapus ${removed} duplikat)` : '');
  }

  private buildCompare(): (a: string, b: string) => number {
    const fold = (s: string) => this.caseSensitive ? s : s.toLowerCase();
    switch (this.mode) {
      case 'asc':
        return (a, b) => fold(a).localeCompare(fold(b));
      case 'desc':
        return (a, b) => fold(b).localeCompare(fold(a));
      case 'natural-asc':
        return (a, b) => this.naturalCompare(fold(a), fold(b));
      case 'natural-desc':
        return (a, b) => this.naturalCompare(fold(b), fold(a));
      case 'length-asc':
        return (a, b) => a.length - b.length || fold(a).localeCompare(fold(b));
      case 'length-desc':
        return (a, b) => b.length - a.length || fold(a).localeCompare(fold(b));
      default:
        return () => 0;
    }
  }

  private naturalCompare(a: string, b: string): number {
    const ax: (string | number)[] = [];
    const bx: (string | number)[] = [];
    a.replace(/(\d+)|(\D+)/g, (_, $1, $2) => { ax.push($1 ? Number($1) : $2); return ''; });
    b.replace(/(\d+)|(\D+)/g, (_, $1, $2) => { bx.push($1 ? Number($1) : $2); return ''; });
    while (ax.length && bx.length) {
      const an = ax.shift()!;
      const bn = bx.shift()!;
      const nn = (typeof an === 'number' && typeof bn === 'number') ? (an as number) - (bn as number) : String(an).localeCompare(String(bn));
      if (nn !== 0) return nn;
    }
    return ax.length - bx.length;
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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
}
