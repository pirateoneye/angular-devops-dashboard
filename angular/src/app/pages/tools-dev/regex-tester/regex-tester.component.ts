import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
} from '@angular/core';
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

interface SamplePattern {
  label: string;
  pattern: string;
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
  matchCount = 0;

  samplePatterns: SamplePattern[] = [
    { label: 'Email', pattern: '^[\\w\\.-]+@[\\w\\.-]+\\.\\w{2,}$' },
    { label: 'URL', pattern: '^https?:\\/\\/[\\w\\.-]+\\.\\w{2,}(\\/\\S*)?$' },
    { label: 'Phone', pattern: '^\\+?[\\d\\s\\-\\(\\)]{7,15}$' },
    {
      label: 'IP Address',
      pattern: '^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$',
    },
    { label: 'Date (ISO)', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
  ];

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly sanitizer = inject(DomSanitizer);

  @HostListener('execute') onExecute(): void {
    this.run();
  }

  onInputChange(): void {
    this.resetTimer();
    this.debounceTimer = setTimeout(() => this.run(), 300);
  }

  selectSample(pattern: string): void {
    this.pattern = pattern;
    this.run();
  }

  private resetTimer(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  run(): void {
    this.resetTimer();
    this.error = '';
    this.matches = [];
    this.matchCount = 0;
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
    this.matchCount = this.matches.length;
    this.buildHighlight();
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private buildHighlight(): void {
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
