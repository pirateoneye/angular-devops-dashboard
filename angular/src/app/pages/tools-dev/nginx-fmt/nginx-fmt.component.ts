import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({ standalone: true, selector: 'app-nginx-fmt',
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatSnackBarModule],
  template: `
    <div class="container pt-3 pb-3" style="max-width:800px">
      <mat-card class="tool-card"><h2 class="tool-title">Nginx Config Formatter</h2>
        <p class="tool-sub">Prettify & validate nginx.conf syntax. Detect common issues.</p><div class="tool-divider"></div>

        <div class="bar"><button mat-raised-button color="primary" (click)="format()"><mat-icon>format_align_left</mat-icon> Format</button>
          <button mat-stroked-button (click)="pasteSample()"><mat-icon>content_paste</mat-icon> Sample</button>
          <button mat-stroked-button color="warn" (click)="input.set('');warnings.set([])"><mat-icon>clear_all</mat-icon> Clear</button></div>

        <div class="panels"><div class="panel"><div class="panel-header"><span>Input</span>
            <button mat-icon-button (click)="copyInput()" matTooltip="Copy"><mat-icon>content_copy</mat-icon></button></div>
          <textarea class="code-area" [(ngModel)]="input"></textarea></div>

        <div class="panel"><div class="panel-header"><span>Formatted</span>
            <button mat-icon-button (click)="copyOutput()" matTooltip="Copy"><mat-icon>content_copy</mat-icon></button></div>
          <pre class="code-area output-area"><code>{{ formatted() }}</code></pre></div></div>

        @if (warnings().length > 0) { <div class="warnings"><mat-icon>warning</mat-icon>
          <div>@for(w of warnings();track w){<div class="warn-item">{{w}}</div>}</div></div> }

        @if (stats().lineCount > 0) { <div class="stats">
          <span>{{ stats().lineCount }} lines · {{ stats().serverCount }} server blocks · {{ stats().locationCount }} locations</span></div> }
      </mat-card></div>
  `, styles: [`
    .tool-title{font-size:1.2rem;font-weight:700}.tool-sub{font-size:.8rem;color:var(--msv-text-muted);margin-bottom:2px}.tool-divider{border-top:1px solid var(--msv-border);margin:14px 0}.tool-card{padding:20px 24px}.bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:14px}.panels{display:grid;grid-template-columns:1fr 1fr;gap:12px}.panel{border:1px solid var(--msv-border);border-radius:8px;overflow:hidden}.panel-header{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:var(--msv-surface-2);border-bottom:1px solid var(--msv-border);font-size:.78rem;font-weight:500}.code-area{width:100%;height:400px;font-family:'SF Mono','Consolas',monospace;font-size:.78rem;padding:14px;border:none;resize:none;outline:none;background:var(--msv-surface)}.output-area{white-space:pre-wrap;overflow-y:auto;background:var(--msv-surface)}.output-area code{font-family:inherit;font-size:inherit}.warnings{margin-top:12px;display:flex;gap:8px;padding:10px 14px;background:#fef9c3;border:1px solid #fde68a;border-radius:8px;font-size:.8rem;color:#854d0e}.warn-item{margin-bottom:2px}.warn-item::before{content:'• '}.stats{margin-top:8px;font-size:.75rem;color:var(--msv-text-muted);text-align:right}@media(max-width:640px){.panels{grid-template-columns:1fr}}
  `]
})
export class NginxFmtComponent {
  private snack = inject(MatSnackBar); private clipboard = inject(Clipboard);
  input = signal(''); warnings = signal<string[]>([]);
  formatted = computed(() => ''); // set manually

  stats = computed(() => {
    const txt = this.input();
    const lines = txt.trim().split('\n').filter(Boolean).length;
    const serverCount = (txt.match(/\bserver\s*\{/g) || []).length;
    const locationCount = (txt.match(/\blocation\s+/g) || []).length;
    return { lineCount: lines, serverCount, locationCount };
  });

  format() { const raw = this.input().trim(); if (!raw) { this.formatted = computed(() => ''); this.warnings.set([]); return }
    const warns: string[] = []; const fmt = this.formatNginx(raw, warns);
    this.warnings.set(warns); this.formatted = computed(() => fmt); }

  pasteSample() { this.input.set(`server {\n    listen 80;\n    server_name example.com www.example.com;\n    return 301 https://$host$request_uri;\n}\n\nserver {\n    listen 443 ssl http2;\n    server_name example.com;\n    ssl_certificate /etc/ssl/certs/example.com.pem;\n    ssl_certificate_key /etc/ssl/private/example.com.key;\n    location / {\n        proxy_pass http://localhost:3000;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n    }\n    location /api {\n        proxy_pass http://localhost:3001;\n        proxy_set_header Host $host;\n    }\n}`) }

  copyInput() { const t = this.input(); if(t) { this.clipboard.copy(t); this.snack.open('Copied','Dismiss',{duration:1500}) } }
  copyOutput() { const t = this.formatted(); if(t) { this.clipboard.copy(t); this.snack.open('Copied','Dismiss',{duration:1500}) } }

  private formatNginx(config: string, warnings: string[]): string {
    config = config.replace(/\r\n/g, '\n').trim(); let indent = 0; const lines: string[] = [];
    const rawLines = config.split('\n');

    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i].trim();
      if (!line) { lines.push(''); continue }

      // Detect common issues
      if (line === 'server_name _;' || line === 'server_name  _;') warnings.push('Default server_name "_" catches all — add explicit server_name');
      if (line.includes('listen 80') && !rawLines.some(l => l.includes('listen 443'))) warnings.push('HTTP-only server at line ' + (i+1) + ' — consider adding HTTPS redirect');
      if (line.startsWith('#') && line.length < 5) warnings.push('Empty comment at line ' + (i+1));

      // Adjust indent: decrease for closing braces
      if (line === '}') indent = Math.max(0, indent - 1);

      // Indent the line
      const pad = '    '.repeat(indent);
      lines.push(pad + line);

      // Increase indent after opening blocks
      if (line.endsWith('{')) indent++;
      if (line.endsWith('}') && !line.startsWith('}')) indent = Math.max(0, indent - 1);
    }

    // Warn about missing final newline/brace balance
    if (indent !== 0) warnings.push(`Brace mismatch: ${indent > 0 ? 'missing ' + indent + ' closing brace(s)' : 'extra closing brace(s)'}`);

    return lines.join('\n');
  }
}
