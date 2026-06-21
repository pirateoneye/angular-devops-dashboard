import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-lorem-ipsum',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule],
  templateUrl: './lorem-ipsum.component.html',
  styleUrls: ['./lorem-ipsum.component.css'],
})
export class LoremIpsumComponent {
  paragraphs = 3;
  sentencesPer = 5;
  startLorem = true;
  output = '';

  private words = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor ' +
    'incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ' +
    'ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate ' +
    'velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt ' +
    'culpa qui officia deserunt mollit anim id est laborum').split(' ');

  constructor(private snackBar: MatSnackBar) {}

  generate(): void {
    const out: string[] = [];
    const n = Math.max(1, Math.min(20, this.paragraphs || 1));
    for (let p = 0; p < n; p++) {
      const s = Math.max(1, Math.min(15, this.sentencesPer || 1));
      const para: string[] = [];
      for (let i = 0; i < s; i++) {
        if (p === 0 && i === 0 && this.startLorem) para.push(this.loremFirst(s));
        else para.push(this.sentence(8 + Math.floor(Math.random() * 8)));
      }
      out.push(para.join(' '));
    }
    this.output = out.join('\n\n');
  }

  private sentence(len: number): string {
    const w: string[] = [];
    for (let i = 0; i < len; i++) w.push(this.words[Math.floor(Math.random() * this.words.length)]);
    let s = w.join(' ');
    return s.charAt(0).toUpperCase() + s.slice(1) + '.';
  }

  private loremFirst(len: number): string {
    const head = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';
    const tail = [];
    for (let i = 0; i < Math.max(0, len - 8); i++) tail.push(this.words[Math.floor(Math.random() * this.words.length)]);
    let s = head + (tail.length ? ' ' + tail.join(' ') : '');
    return s + '.';
  }

  copy(): void {
    if (!this.output) return;
    navigator.clipboard.writeText(this.output).then(() =>
      this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
    );
  }
}