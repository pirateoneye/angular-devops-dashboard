import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-line-tools',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './line-tools.component.html',
  styleUrls: ['./line-tools.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineToolsComponent {
  input = '';
  output = '';

  prefix = '';
  suffix = '';
  startAt = 1;
  step = 1;
  pad = 0;
  padChar = '0';
  separator = ' ';

  mode: 'each' | 'join' = 'each';
  numbering = false;
  trimFirst = true;
  skipBlank = false;

  constructor(private snackBar: MatSnackBar) {}

  get lines(): string[] {
    if (!this.input) return [];
    let lines = this.input.split(/\r?\n/);
    if (this.trimFirst) lines = lines.map((l) => l.trim());
    if (this.skipBlank) lines = lines.filter((l) => l !== '');
    return lines;
  }

  get stats(): string {
    const total = this.input ? this.input.split(/\r?\n/).length : 0;
    return `${this.lines.length} baris diproses · ${total} total`;
  }

  run(): void {
    const lines = this.lines;
    let counter = this.startAt;
    const result = lines.map((l) => {
      let out = l;
      let pre = this.prefix;
      if (this.numbering) {
        const n = String(counter);
        pre += this.pad > 0 ? n.padStart(this.pad, this.padChar || ' ') : n;
        counter += this.step;
      }
      out = `${pre}${out}${this.suffix}`;
      return out;
    });
    this.output = this.mode === 'join' ? result.join(this.separator) : result.join('\n');
  }

  copy(): void {
    if (!this.output) return;
    navigator.clipboard.writeText(this.output).then(() =>
      this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
    );
  }

  clear(): void {
    this.input = '';
    this.output = '';
  }

  example(): void {
    this.input = 'apple\nbanana\ncherry\ndate\nelderberry';
    this.prefix = '';
    this.suffix = '';
    this.numbering = true;
    this.pad = 2;
    this.mode = 'each';
  }
}
