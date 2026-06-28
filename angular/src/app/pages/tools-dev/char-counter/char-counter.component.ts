import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

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

  constructor() {}

  get chars(): number { return this.input.length; }
  get charsNoSpaces(): number { return this.input.replace(/\s/g, '').length; }
  get bytes(): number { return new Blob([this.input]).size; }
  get words(): number {
    const m = this.input.match(/\S+/g);
    return m ? m.length : 0;
  }
  get lines(): number {
    if (!this.input) return 0;
    return this.input.split(/\r?\n/).length;
  }
  get sentences(): number {
    const m = this.input.match(/[^.!?]+[.!?]+/g);
    return m ? m.length : (this.input.trim() ? 1 : 0);
  }
  get paragraphs(): number {
    if (!this.input.trim()) return 0;
    return this.input.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
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
    for (const ch of this.input) {
      const key = /\s/.test(ch) ? '␣' : ch;
      map.set(key, (map.get(key) ?? 0) + 1);
      total++;
    }
    if (total === 0) return [];
    return Array.from(map.entries())
      .map(([char, count]) => ({ char, count, pct: Math.round((count / total) * 1000) / 10 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }
}
