import { ChangeDetectionStrategy, Component } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    this.buildHighlight();
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private buildHighlight(): void {
    // Splice <mark>/</mark> around the match ranges already computed on the
    // RAW testString (this.matches holds m.index + m[0].length). Escaping each
    // slice independently avoids re-running the user pattern against the
    // HTML-escaped string, which would mismatch on &lt;/&gt;/&amp; entities.
    let html = '';
    let lastEnd = 0;
    for (const m of this.matches) {
      const start = m.index;
      const end = m.index + m.match.length;
      html += this.escapeHtml(this.testString.slice(lastEnd, start));
      html += '<mark>';
      html += this.escapeHtml(this.testString.slice(start, end));
      html += '</mark>';
      lastEnd = end;
    }
    html += this.escapeHtml(this.testString.slice(lastEnd));
    this.highlighted = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  copy(value: string): void {
    if (!value) return;
    navigator.clipboard.writeText(value);
  }
}