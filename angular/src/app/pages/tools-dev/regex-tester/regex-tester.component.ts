import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface MatchRow {
  index: number;
  match: string;
  groups: string[];
}

@Component({
  selector: 'app-regex-tester',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './regex-tester.component.html',
  styleUrls: ['./regex-tester.component.css'],
})
export class RegexTesterComponent {
  pattern = '';
  flags = 'g';
  testString = '';
  error = '';
  matches: MatchRow[] = [];
  highlighted: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  run(): void {
    this.error = '';
    this.matches = [];
    this.highlighted = this.sanitizer.bypassSecurityTrustHtml('');
    if (!this.pattern) {
      this.error = 'Pattern kosong.';
      return;
    }
    let re: RegExp;
    try {
      re = new RegExp(this.pattern, this.flags);
    } catch (e) {
      this.error = 'Regex tidak valid: ' + (e as Error).message;
      return;
    }

    if (this.flags.includes('g')) {
      let m: RegExpExecArray | null;
      const global = new RegExp(this.pattern, this.flags);
      while ((m = global.exec(this.testString)) !== null) {
        this.matches.push({
          index: m.index,
          match: m[0],
          groups: m.slice(1).map((g) => (g === undefined ? '' : g)),
        });
        if (m[0] === '') global.lastIndex++;
      }
    } else {
      const m = re.exec(this.testString);
      if (m) {
        this.matches.push({
          index: m.index,
          match: m[0],
          groups: m.slice(1).map((g) => (g === undefined ? '' : g)),
        });
      }
    }
    this.buildHighlight(re);
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private buildHighlight(re: RegExp): void {
    const escaped = this.escapeHtml(this.testString);
    let html: string;
    if (this.flags.includes('g')) {
      const global = new RegExp(this.pattern, this.flags.includes('g') ? this.flags : this.flags + 'g');
      html = escaped.replace(global, (match) => `<mark>${match}</mark>`);
    } else {
      html = escaped.replace(re, (match) => `<mark>${match}</mark>`);
    }
    this.highlighted = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  copy(value: string): void {
    if (!value) return;
    navigator.clipboard.writeText(value);
  }
}