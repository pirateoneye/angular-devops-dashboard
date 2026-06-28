import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface WordRow { word: string; count: number; pct: number; }

@Component({
  selector: 'app-word-frequency',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './word-frequency.component.html',
  styleUrls: ['./word-frequency.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordFrequencyComponent {
  input = '';
  caseSensitive = false;
  ignoreStopWords = true;
  minLen = 1;
  topN = 25;
  sortMode: 'count' | 'alpha' = 'count';

  private stopWords = new Set([
    'the','a','an','and','or','but','of','to','in','on','for','with','at','by','from','is','are','was','were','be','been','being',
    'this','that','these','those','it','its','as','if','then','than','so','do','does','did','has','have','had','will','would','can','could','should',
    'dan','yang','di','ke','dari','untuk','pada','oleh','ini','itu','ada','tidak','akan','saya','kamu','dia','mereka','kita','kami','adalah','dengan','atau','juga','sudah','belum','lagi','sangat','sebuah','seorang',
  ]);

  get totalWords(): number {
    return this.tokens().length;
  }

  get uniqueWords(): number {
    return this.rows().length;
  }

  private tokens(): string[] {
    if (!this.input.trim()) return [];
    const matched: string[] = this.input.match(/[A-Za-z0-9\u00C0-\u024F_]+/g) ?? [];
    let tokens: string[] = matched;
    if (!this.caseSensitive) tokens = tokens.map((t) => t.toLowerCase());
    if (this.minLen > 1) tokens = tokens.filter((t) => t.length >= this.minLen);
    if (this.ignoreStopWords && !this.caseSensitive) tokens = tokens.filter((t) => !this.stopWords.has(t));
    return tokens;
  }

  rows(): WordRow[] {
    const tokens = this.tokens();
    if (tokens.length === 0) return [];
    const map = new Map<string, number>();
    for (const t of tokens) map.set(t, (map.get(t) ?? 0) + 1);
    const total = tokens.length;
    const arr = Array.from(map.entries()).map(([word, count]) => ({ word, count, pct: Math.round((count / total) * 1000) / 10 }));
    if (this.sortMode === 'count') arr.sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
    else arr.sort((a, b) => a.word.localeCompare(b.word));
    return arr.slice(0, Math.max(1, this.topN));
  }

  get maxCount(): number {
    const r = this.rows();
    return r.length ? r[0].count : 0;
  }

  barWidth(row: WordRow): number {
    return this.maxCount ? Math.round((row.count / this.maxCount) * 100) : 0;
  }

  clear(): void {
    this.input = '';
  }

  example(): void {
    this.input = 'The quick brown fox jumps over the lazy dog. The dog barked at the fox, but the fox ran away quickly. Quick thinking saved the day, and the day was saved by quick action.';
  }
}
