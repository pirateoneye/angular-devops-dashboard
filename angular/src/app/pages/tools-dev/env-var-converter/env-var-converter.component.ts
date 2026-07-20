import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClipboardService } from '../../../shared/service/clipboard/clipboard.service';

type OutputFormat = 'k8s-secret' | 'docker' | 'json' | 'yaml' | 'bash' | 'powershell';

interface EnvVar {
  key: string;
  value: string;
}

const FORMAT_OPTIONS: { id: OutputFormat; label: string; icon: string }[] = [
  { id: 'k8s-secret', label: 'K8s Secret', icon: 'lock' },
  { id: 'docker', label: 'Docker', icon: 'inventory_2' },
  { id: 'json', label: 'JSON', icon: 'data_object' },
  { id: 'yaml', label: 'YAML', icon: 'description' },
  { id: 'bash', label: 'Bash', icon: 'terminal' },
  { id: 'powershell', label: 'PowerShell', icon: 'code' },
];

@Component({
  selector: 'app-env-var-converter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './env-var-converter.component.html',
  styleUrls: ['./env-var-converter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnvVarConverterComponent {
  private readonly clipboardSvc = inject(ClipboardService);
  private readonly snackBar = inject(MatSnackBar);

  readonly input = signal('');
  readonly outputFormat = signal<OutputFormat>('k8s-secret');
  readonly copied = signal(false);

  readonly formatOptions = FORMAT_OPTIONS;

  /** Parse input lines into EnvVar[] — supports KEY=VALUE, KEY="VALUE", KEY='VALUE', export KEY=VALUE. */
  private parseInput(text: string): EnvVar[] {
    const out: EnvVar[] = [];
    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const stripped = line.startsWith('export ') ? line.slice(7) : line;
      const eqIdx = stripped.indexOf('=');
      if (eqIdx === -1) continue;
      const key = stripped.slice(0, eqIdx).trim();
      let value = stripped.slice(eqIdx + 1).trim();
      // Strip surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key) out.push({ key, value });
    }
    return out;
  }

  readonly output = computed(() => {
    const text = this.input();
    if (!text.trim()) return '';
    const vars = this.parseInput(text);
    if (vars.length === 0) return '';
    return this.format(vars);
  });

  readonly error = computed(() => {
    const text = this.input();
    if (!text.trim()) return '';
    const vars = this.parseInput(text);
    if (vars.length === 0) return 'Tidak ada KEY=VALUE valid ditemukan.';
    return '';
  });

  readonly stats = computed(() => {
    const text = this.input();
    if (!text.trim()) return null;
    const vars = this.parseInput(text);
    return {
      count: vars.length,
      bytes: new Blob([this.output()]).size,
    };
  });

  private format(vars: EnvVar[]): string {
    switch (this.outputFormat()) {
      case 'k8s-secret':
        return this.toK8sSecret(vars);
      case 'docker':
        return this.toDocker(vars);
      case 'json':
        return this.toJson(vars);
      case 'yaml':
        return this.toYaml(vars);
      case 'bash':
        return this.toBash(vars);
      case 'powershell':
        return this.toPowerShell(vars);
      default:
        return '';
    }
  }

  /** K8s Secret with base64-encoded values. */
  private toK8sSecret(vars: EnvVar[]): string {
    const dataLines = vars
      .map((v) => `  ${v.key}: ${this.b64EncodeUnicode(v.value)}`)
      .join('\n');
    return `apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
${dataLines}
`;
  }

  /** Docker Compose environment block. */
  private toDocker(vars: EnvVar[]): string {
    return vars.map((v) => `  ${v.key}=${v.value}`).join('\n');
  }

  /** JSON object — values quoted, keys stringified. */
  private toJson(vars: EnvVar[]): string {
    const obj: Record<string, string> = {};
    for (const v of vars) obj[v.key] = v.value;
    return JSON.stringify(obj, null, 2);
  }

  /** YAML env file format. */
  private toYaml(vars: EnvVar[]): string {
    return vars
      .map((v) => `${v.key}: ${this.yamlValue(v.value)}`)
      .join('\n');
  }

  /** Bash export statements. */
  private toBash(vars: EnvVar[]): string {
    return vars.map((v) => `export ${v.key}="${v.value.replace(/"/g, '\\"')}"`).join('\n');
  }

  /** PowerShell variable assignment. */
  private toPowerShell(vars: EnvVar[]): string {
    return vars.map((v) => `$env:${v.key} = "${v.value.replace(/"/g, '`"')}"`).join('\n');
  }

  /** Quote a YAML value — bare if safe, single-quoted if it has special chars. */
  private yamlValue(value: string): string {
    if (value === '' || /^\d+$/.test(value) || /^(true|false|null)$/i.test(value)) {
      return value === '' ? '""' : value;
    }
    if (/[:#{}[],&*!|>'"%@`]/.test(value) || value.includes('\n')) {
      return `'${value.replace(/'/g, "''")}'`;
    }
    return value;
  }

  /** Base64 encode handling UTF-8 (from MDN). */
  private b64EncodeUnicode(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  }

  pasteSample(): void {
    this.input.set(
      'DATABASE_URL=postgres://user:pass@host:5432/db\nAPI_KEY=sk-abc123xyz789\nREDIS_PASSWORD=s3cret!r3d1s\nNODE_ENV=production\nLOG_LEVEL=info\nPORT=3000\nCORS_ORIGIN=https://app.example.com\nJWT_SECRET=super-secret-jwt-key-change-me',
    );
  }

  clear(): void {
    this.input.set('');
    this.copied.set(false);
  }
  async copyOutput(): Promise<void> {
    const text = this.output();
    if (!text) return;
    const ok = await this.clipboardSvc.copy(text);
    if (ok) {
      this.snackBar.open('Copied to clipboard', 'Dismiss', { duration: 1500 });
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } else {
      this.snackBar.open('Copy failed', 'Dismiss', { duration: 2000 });
    }
  }
}