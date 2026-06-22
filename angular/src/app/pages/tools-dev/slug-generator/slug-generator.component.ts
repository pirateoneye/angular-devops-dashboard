import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-slug-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './slug-generator.component.html',
  styleUrls: ['./slug-generator.component.css'],
})
export class SlugGeneratorComponent {
  input = '';
  output = '';

  separator = '-';
  lowercase = true;
  strictAscii = true;
  stripStopWords = false;
  maxLength = 0; // 0 = unlimited

  private stopWords = new Set(['a','an','the','and','or','but','of','to','in','on','for','with','at','by','from','is','are','dan','yang','di','ke','dari','untuk','pada','oleh']);

  constructor(private snackBar: MatSnackBar) {}

  get slug(): string {
    if (!this.input.trim()) return '';
    let s = this.input;

    // Transliterate common accented / special chars to ascii.
    if (this.strictAscii) s = this.asciiFold(s);

    if (this.lowercase) s = s.toLowerCase();

    // Replace any non word char with separator.
    const sep = this.separator;
    s = s.replace(/[^a-zA-Z0-9]+/g, sep);

    // Optional stop-word removal (only meaningful when tokenized by separator).
    if (this.stripStopWords) {
      s = s.split(sep).filter((tok) => !this.stopWords.has(tok.toLowerCase())).join(sep);
    }

    // Collapse separators & trim.
    s = s.replace(new RegExp(`\\${sep}{2,}`, 'g'), sep).replace(new RegExp(`^\\${sep}+|\\${sep}+$`, 'g'), '');

    if (this.maxLength > 0) s = s.slice(0, this.maxLength).replace(new RegExp(`\\${sep}?$`, 'g'), '');
    return s;
  }

  generate(): void {
    this.output = this.slug;
    if (this.output) this.snackBar.open('Slug dibuat', 'Close', { duration: 1200 });
  }

  private asciiFold(s: string): string {
    let r = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    r = r.replace(/[ðÐ]/g, 'd').replace(/[øØ]/g, 'o').replace(/[æÆ]/g, 'ae').replace(/[þÞ]/g, 'th').replace(/[ß]/g, 'ss');
    return r;
  }

  clear(): void {
    this.input = '';
    this.output = '';
  }

  copyOutput(): void {
    if (!this.output) return;
    navigator.clipboard.writeText(this.output).then(() =>
      this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
    );
  }
}
