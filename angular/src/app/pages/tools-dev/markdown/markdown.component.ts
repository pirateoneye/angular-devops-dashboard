import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-markdown',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule],
  templateUrl: './markdown.component.html',
  styleUrls: ['./markdown.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownComponent {
  input = `# Markdown Preview

Tulis **tebal**, *miring*, dan \`inline code\`.

- item satu
- item dua

1. ordered
2. list

> kutipan

[link](https://example.com)

\`\`\`
code block
multi-line
\`\`\`

---`;

  html: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {
    this.render();
  }

  render(): void {
    this.html = this.sanitizer.bypassSecurityTrustHtml(this.parse(this.input));
  }

  private esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private inline(s: string): string {
    return s
      .replace(/`([^`]+)`/g, (_m, c) => '<code>' + c + '</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
        if (this.isSafeUrl(url)) {
          const safeUrl = url.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          return '<a href="' + safeUrl + '" target="_blank" rel="noopener">' + text + '</a>';
        }
        return text;
      });
  }

  private isSafeUrl(url: string): boolean {
    const u = (url || '').trim();
    if (u === '') {
      return false;
    }
    // Relative URLs only (reject protocol-relative "//host" which can target another origin).
    if (u.startsWith('/') && !u.startsWith('//')) {
      return true;
    }
    if (u.startsWith('#') || u.startsWith('./')) {
      return true;
    }
    // Absolute URLs must use an allow-listed scheme.
    const m = /^([a-zA-Z][a-zA-Z0-9+.\-]*):/.exec(u);
    if (m) {
      const scheme = m[1].toLowerCase();
      return scheme === 'http' || scheme === 'https' || scheme === 'mailto' || scheme === 'tel';
    }
    return false;
  }

  private parse(src: string): string {
    const blocks: string[] = [];
    let s = src.replace(/```([\s\S]*?)```/g, (m) => {
      const inner = m.slice(3, -3).replace(/^\n/, '');
      blocks.push('<pre><code>' + this.esc(inner) + '</code></pre>');
      return '\x00B' + (blocks.length - 1) + '\x00';
    });
    s = this.esc(s);
    const lines = s.split('\n');
    let out = '';
    let inUl = false;
    let inOl = false;
    const close = () => { if (inUl) { out += '</ul>'; inUl = false; } if (inOl) { out += '</ol>'; inOl = false; } };
    for (const raw of lines) {
      const line = raw;
      const bm = /^\x00B(\d+)\x00$/.exec(line.trim());
      if (bm) { close(); out += blocks[+bm[1]]; continue; }
      if (/^###\s+/.test(line)) { close(); out += '<h3>' + this.inline(line.replace(/^###\s+/, '')) + '</h3>'; continue; }
      if (/^##\s+/.test(line)) { close(); out += '<h2>' + this.inline(line.replace(/^##\s+/, '')) + '</h2>'; continue; }
      if (/^#\s+/.test(line)) { close(); out += '<h1>' + this.inline(line.replace(/^#\s+/, '')) + '</h1>'; continue; }
      if (/^>\s+/.test(line)) { close(); out += '<blockquote>' + this.inline(line.replace(/^>\s+/, '')) + '</blockquote>'; continue; }
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) { close(); out += '<hr>'; continue; }
      if (/^\s*[-*]\s+/.test(line)) { if (!inUl) { out += '<ul>'; inUl = true; } out += '<li>' + this.inline(line.replace(/^\s*[-*]\s+/, '')) + '</li>'; continue; }
      if (/^\s*\d+\.\s+/.test(line)) { if (!inOl) { out += '<ol>'; inOl = true; } out += '<li>' + this.inline(line.replace(/^\s*\d+\.\s+/, '')) + '</li>'; continue; }
      if (line.trim() === '') { close(); continue; }
      close();
      out += '<p>' + this.inline(line) + '</p>';
    }
    close();
    return out;
  }
}