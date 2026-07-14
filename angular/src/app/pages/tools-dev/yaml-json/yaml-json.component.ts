import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({ standalone: true, selector: 'app-yaml-json',
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatSnackBarModule],
  template: `
    <div class="container pt-3 pb-3" style="max-width:800px">
      <mat-card class="tool-card"><h2 class="tool-title">YAML ↔ JSON</h2>
        <p class="tool-sub">Convert YAML to JSON and back. Validate syntax.</p><div class="tool-divider"></div>

        <div class="bar"><button mat-raised-button color="primary" (click)="convert('json')" [class.active]="direction()==='json'">
          <mat-icon>arrow_forward</mat-icon> YAML → JSON</button>
        <button mat-raised-button color="primary" (click)="convert('yaml')" [class.active]="direction()==='yaml'">
          <mat-icon>arrow_back</mat-icon> JSON → YAML</button>
        <button mat-stroked-button (click)="pasteSample()"><mat-icon>content_paste</mat-icon> Sample</button></div>

        <div class="panels"><div class="panel">
          <div class="panel-header"><span>{{ direction() === 'json' ? 'YAML Input' : 'JSON Input' }}</span>
            <button mat-icon-button (click)="copyInput()" matTooltip="Copy"><mat-icon>content_copy</mat-icon></button></div>
          <textarea class="code-area" [placeholder]="placeholders()[direction()]" [(ngModel)]="input"></textarea></div>

        <div class="panel"><div class="panel-header"><span>{{ direction() === 'json' ? 'JSON Output' : 'YAML Output' }}</span>
            <button mat-icon-button (click)="copyOutput()" matTooltip="Copy"><mat-icon>content_copy</mat-icon></button></div>
          <pre class="code-area output-area"><code [style.color]="outputError()?'var(--msv-error)':''">{{ output() }}</code></pre></div></div>
      </mat-card></div>
  `, styles: [`
    .tool-title{font-size:1.2rem;font-weight:700}.tool-sub{font-size:.8rem;color:var(--msv-text-muted);margin-bottom:2px}.tool-divider{border-top:1px solid var(--msv-border);margin:14px 0}.tool-card{padding:20px 24px}.bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:14px}.bar button.active{background:var(--msv-accent-bg);color:var(--msv-primary);border-color:var(--msv-primary)}.panels{display:grid;grid-template-columns:1fr 1fr;gap:12px}.panel{border:1px solid var(--msv-border);border-radius:8px;overflow:hidden}.panel-header{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:var(--msv-surface-2);border-bottom:1px solid var(--msv-border);font-size:.78rem;font-weight:500}.code-area{width:100%;height:400px;font-family:'SF Mono','Consolas',monospace;font-size:.8rem;padding:14px;border:none;resize:none;outline:none;background:var(--msv-surface)}.output-area{white-space:pre-wrap;word-break:break-all;overflow-y:auto}.output-area code{font-family:inherit;font-size:inherit}@media(max-width:640px){.panels{grid-template-columns:1fr}}
  `]
})
export class YamlJsonComponent {
  private snack = inject(MatSnackBar); private clipboard = inject(Clipboard);
  input = signal(''); output = signal(''); outputError = signal(false); direction = signal<'json'|'yaml'>('json');

  placeholders = signal<Record<string, string>>({ json: 'key: value\nlist:\n  - item1\n  - item2', yaml: '{\n  "key": "value",\n  "list": [1, 2, 3]\n}' });
  convert(dir: 'json'|'yaml') { this.direction.set(dir); const raw = this.input().trim(); if (!raw) { this.output.set(''); this.outputError.set(false); return }
    try { if (dir === 'json') { this.output.set(this.yamlToJson(raw)); this.outputError.set(false) } else { this.output.set(this.jsonToYaml(raw)); this.outputError.set(false) } }
    catch(e) { this.output.set(e instanceof Error ? e.message : 'Parse error'); this.outputError.set(true) } }

  pasteSample() { this.direction.set('json'); this.input.set('name: my-app\nversion: 1.0.0\nreplicas: 3\nports:\n  - 8080\n  - 8443\nenv:\n  NODE_ENV: production\n  DEBUG: false') }

  copyInput() { const t = this.input(); if(t) { this.clipboard.copy(t); this.snack.open('Input copied','Dismiss',{duration:1500}) } }
  copyOutput() { const t = this.output(); if(t) { this.clipboard.copy(t); this.snack.open('Output copied','Dismiss',{duration:1500}) } }

  // Minimal YAML parser (no external deps)
  private yamlToJson(yaml: string): string { const obj = this.parseYaml(yaml); return JSON.stringify(obj, null, 2) }

  private parseYaml(yaml: string): any {
    const lines = yaml.split('\n').filter(l => !l.trim().startsWith('#')); const root: any = {}; const stack: Array<{ obj: any; indent: number }> = [{ obj: root, indent: -1 }];
    for (const line of lines) {
      if (!line.trim()) continue; const indent = line.search(/\S/);
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
      const current = stack[stack.length - 1].obj; const content = line.trim();
      if (content.startsWith('- ')) { const val = this.parseYamlValue(content.slice(2).trim()); if (!Array.isArray(current)) { const keys = Object.keys(current); const lastKey = keys[keys.length - 1]; if (!Array.isArray(current[lastKey])) current[lastKey] = [] } const arr = Array.isArray(current) ? current : current[Object.keys(current).pop()!]; arr.push(val); stack.push({ obj: val, indent }) }
      else { const colon = content.indexOf(':'); if (colon === -1) continue; const key = content.slice(0, colon).trim(); const val = content.slice(colon + 1).trim(); const parsed = this.parseYamlValue(val); current[key] = parsed; if (typeof parsed === 'object' && parsed !== null) stack.push({ obj: parsed, indent }) } }
    return root;
  }

  private parseYamlValue(val: string): any { if (!val) return {}; if (val === 'true') return true; if (val === 'false') return false; if (val === 'null' || val === '~') return null; if (/^-?\d+$/.test(val)) return parseInt(val); if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val); if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) return val.slice(1, -1); return val }

  private jsonToYaml(json: string): string { const obj = JSON.parse(json); return this.stringifyYaml(obj, 0) }
  private stringifyYaml(val: any, indent: number): string { const pad = '  '.repeat(indent);
    if (Array.isArray(val)) return val.map(v => `${pad}- ${this.stringifyYaml(v, indent + 1).replace(/^\s+/, '')}`).join('\n');
    if (val !== null && typeof val === 'object') return Object.entries(val).map(([k, v]) => {
      if (v !== null && typeof v === 'object') return `${pad}${k}:\n${this.stringifyYaml(v, indent + 1)}`;
      return `${pad}${k}: ${JSON.stringify(v)}`;
    }).join('\n');
    return `${pad}${JSON.stringify(val)}`;
  }
}
