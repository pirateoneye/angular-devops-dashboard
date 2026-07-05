import {
  Component,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface JsonStats {
  keyCount: number;
  maxDepth: number;
  lineCount: number;
  byteCount: number;
}

@Component({
  selector: 'app-json-formatter',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatIconModule],
  templateUrl: './json-formatter.component.html',
  styleUrls: ['./json-formatter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonFormatterComponent {
  input = '';
  output = '';
  error = '';
  stats: JsonStats | null = null;
  indentSize: 2 | 4 = 2;
  sortKeys = false;
  autoMode = false;
  private debounceTimer: any = null;

  // Syntax-colored output
  outputHtml: SafeHtml = '';

  constructor(
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
  ) {}

  @HostListener('execute') onExecute(): void {
    this.format();
  }

  onInputChange(): void {
    if (!this.autoMode) return;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.format(), 300);
  }

  private parse(): unknown | null {
    this.error = '';
    this.stats = null;
    this.outputHtml = '';
    if (!this.input.trim()) {
      this.error = 'Input kosong.';
      return null;
    }
    try {
      return JSON.parse(this.input);
    } catch (e) {
      this.error = 'JSON tidak valid: ' + (e as Error).message;
      return null;
    }
  }

  format(): void {
    const data = this.parse();
    if (data === null) return;
    const replacer = this.sortKeys ? sortKeysReplacer : undefined;
    this.output = JSON.stringify(data, replacer, this.indentSize);
    this.setStats(data);
    this.outputHtml = this.colorizeJson(this.output);
  }

  minify(): void {
    const data = this.parse();
    if (data === null) return;
    this.output = JSON.stringify(data);
    this.setStats(data);
    this.outputHtml = '';
  }

  validate(): void {
    const data = this.parse();
    if (data === null) {
      this.snackBar.open('JSON tidak valid', 'Close', { duration: 2000 });
      return;
    }
    this.output = '';
    this.outputHtml = '';
    this.snackBar.open('JSON valid ✓', 'Close', { duration: 2000 });
    this.setStats(data);
  }

  clear(): void {
    this.input = '';
    this.output = '';
    this.error = '';
    this.stats = null;
    this.outputHtml = '';
  }

  copyOutput(): void {
    this.copy(this.output);
  }

  copy(value: string): void {
    if (!value) return;
    navigator.clipboard
      .writeText(value)
      .then(() =>
        this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
      );
  }

  private setStats(data: unknown): void {
    const keyCount = countKeys(data);
    const maxDepth = maxNestingDepth(data);
    const lineCount = this.output ? this.output.split('\n').length : 0;
    const byteCount = new Blob([this.input]).size;
    this.stats = { keyCount, maxDepth, lineCount, byteCount };
  }

  /** Colorize JSON keys/values via simple regex tokenizer. */
  colorizeJson(json: string): SafeHtml {
    const escaped = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const colored = escaped
      .replace(/("(?:\\.|[^"\\])*")\s*:/g, '<span class="json-key">$1</span>:')
      .replace(
        /:\s*("(?:\\.|[^"\\])*")/g,
        ': <span class="json-string">$1</span>',
      )
      .replace(
        /:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g,
        ': <span class="json-number">$1</span>',
      )
      .replace(/:\s*(true|false)/g, ': <span class="json-bool">$1</span>')
      .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
    return this.sanitizer.bypassSecurityTrustHtml(colored);
  }
}

// ponytail: pure helpers, no need for a service class

function sortKeysReplacer(_key: string, value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = (value as Record<string, unknown>)[k];
        return acc;
      }, {});
  }
  return value;
}

function countKeys(data: unknown): number {
  if (data === null || typeof data !== 'object') return 0;
  if (Array.isArray(data))
    return data.reduce((sum, item) => sum + countKeys(item), 0);
  const obj = data as Record<string, unknown>;
  let count = Object.keys(obj).length;
  for (const v of Object.values(obj)) {
    count += countKeys(v);
  }
  return count;
}

function maxNestingDepth(data: unknown, current = 0): number {
  if (data === null || typeof data !== 'object') return current;
  if (Array.isArray(data)) {
    let max = current + 1;
    for (const item of data) {
      max = Math.max(max, maxNestingDepth(item, current + 1));
    }
    return max;
  }
  let max = current + 1;
  for (const v of Object.values(data as Record<string, unknown>)) {
    max = Math.max(max, maxNestingDepth(v, current + 1));
  }
  return max;
}
