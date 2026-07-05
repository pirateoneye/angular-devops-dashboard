import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-char-counter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './char-counter.component.html',
  styleUrls: ['./char-counter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharCounterComponent {
  input = '';
  debouncedInput = '';
  selectedCount = 0;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
  ) {}

  onInputChange(value: string): void {
    this.input = value;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debouncedInput = value;
      this.cdr.markForCheck();
    }, 300);
  }

  onSelect(event: Event): void {
    const ta = event.target as HTMLTextAreaElement;
    this.selectedCount = ta.value.substring(
      ta.selectionStart,
      ta.selectionEnd,
    ).length;
    this.cdr.markForCheck();
  }

  get chars(): number {
    return this.debouncedInput.length;
  }
  get charsNoSpaces(): number {
    return this.debouncedInput.replace(/\s/g, '').length;
  }
  get bytes(): number {
    return new Blob([this.debouncedInput]).size;
  }
  get words(): number {
    const m = this.debouncedInput.match(/\S+/g);
    return m ? m.length : 0;
  }
  get lines(): number {
    if (!this.debouncedInput) return 0;
    return this.debouncedInput.split(/\r?\n/).length;
  }
  get sentences(): number {
    const m = this.debouncedInput.match(/[^.!?]+[.!?]+/g);
    return m ? m.length : this.debouncedInput.trim() ? 1 : 0;
  }
  get paragraphs(): number {
    if (!this.debouncedInput.trim()) return 0;
    return this.debouncedInput
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > 0).length;
  }
  get readingTime(): string {
    const w = this.words;
    if (w === 0) return '0 detik';
    const sec = Math.round((w / 200) * 60);
    if (sec < 60) return `${sec} detik`;
    const min = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${min} mnt ${rem} dtk`;
  }
  get freq(): { char: string; count: number; pct: number }[] {
    const map = new Map<string, number>();
    let total = 0;
    for (const ch of this.debouncedInput) {
      const key = /\s/.test(ch) ? '␣' : ch;
      map.set(key, (map.get(key) ?? 0) + 1);
      total++;
    }
    if (total === 0) return [];
    return Array.from(map.entries())
      .map(([char, count]) => ({
        char,
        count,
        pct: Math.round((count / total) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  copyStats(): void {
    const stats = [
      `Characters: ${this.chars}`,
      `Characters (no spaces): ${this.charsNoSpaces}`,
      `Bytes (UTF-8): ${this.bytes}`,
      `Words: ${this.words}`,
      `Lines: ${this.lines}`,
      `Sentences: ${this.sentences}`,
      `Paragraphs: ${this.paragraphs}`,
      `Reading time: ${this.readingTime}`,
    ].join('\n');
    navigator.clipboard.writeText(stats).then(() => {
      this.snackBar.open('Stats disalin', 'Close', { duration: 1500 });
    });
  }
}
