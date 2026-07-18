import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'app-k8s-generator',
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatTabsModule, MatSnackBarModule, MatTooltipModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="container pt-3 pb-3" style="max-width:780px">
      <mat-card class="tool-card">
        <h2 class="tool-title">K8s Secret → .env Generator</h2>
        <p class="tool-sub">Convert .env files to Kubernetes Secrets, ConfigMaps, and YAML manifests — both directions</p>
        <div class="tool-divider"></div>

        <mat-tab-group [(selectedIndex)]="activeTab" (selectedIndexChange)="tabChanged($event)">
          <!-- Tab 1: .env → K8s -->
          <mat-tab label=".env → Secret">
            <div class="tab-content">
              <div class="input-label">Paste .env content:</div>
              <textarea class="code-input"
                [placeholder]="'DATABASE_URL=postgres://user:pass@host:5432/db&#10;API_KEY=sk-abc123&#10;REDIS_PASSWORD=s3cret!&#10;NODE_ENV=production'"
                [(ngModel)]="envInput"
              ></textarea>
              <div class="action-bar">
                <mat-form-field appearance="outline" style="width:200px">
                  <mat-label>Secret Name</mat-label>
                  <input matInput [(ngModel)]="secretName" placeholder="app-secrets">
                </mat-form-field>
                <mat-form-field appearance="outline" style="width:160px">
                  <mat-label>Namespace</mat-label>
                  <input matInput [(ngModel)]="namespace" placeholder="default">
                </mat-form-field>
                <button mat-raised-button color="primary" (click)="pasteSampleEnv()" matTooltip="Paste sample .env">
                  <mat-icon>content_paste</mat-icon> Sample
                </button>
              </div>

              @if (parsedEnv().length > 0) {
                <div class="preview-section">
                  <div class="preview-header">
                    <span class="preview-label">{{ parsedEnv().length }} variables detected</span>
                    <button mat-icon-button (click)="copyEnvOutput()" matTooltip="Copy to clipboard"><mat-icon>content_copy</mat-icon></button>
                  </div>

                  <mat-tab-group style="margin-top:8px">
                    <mat-tab label="kubectl">
                      <pre class="output"><code>{{ envToKubectl() }}</code></pre>
                    </mat-tab>
                    <mat-tab label="Secret YAML">
                      <pre class="output"><code>{{ envToSecretYaml() }}</code></pre>
                    </mat-tab>
                    <mat-tab label="ConfigMap YAML">
                      <pre class="output"><code>{{ envToConfigMapYaml() }}</code></pre>
                    </mat-tab>
                    <mat-tab label="Docker Run">
                      <pre class="output"><code>{{ envToDockerRun() }}</code></pre>
                    </mat-tab>
                    <mat-tab label="Docker Compose">
                      <pre class="output"><code>{{ envToComposeEnv() }}</code></pre>
                    </mat-tab>
                  </mat-tab-group>
                </div>
              }
            </div>
          </mat-tab>

          <!-- Tab 2: K8s Secret → .env -->
          <mat-tab label="Secret YAML → .env">
            <div class="tab-content">
              <div class="input-label">Paste K8s Secret YAML:</div>
              <textarea class="code-input yaml-input"
                placeholder="apiVersion: v1&#10;kind: Secret&#10;metadata:&#10;  name: app-secrets&#10;data:&#10;  DATABASE_URL: cG9zdGdyZXM6Ly8uLi4=&#10;  API_KEY: c2stYWJjMTIz"
                [(ngModel)]="yamlInput"
              ></textarea>
              <div class="action-bar">
                <button mat-raised-button color="primary" (click)="pasteSampleYaml()" matTooltip="Paste sample Secret YAML">
                  <mat-icon>content_paste</mat-icon> Sample
                </button>
              </div>

              @if (decodedYaml().length > 0) {
                <div class="preview-section">
                  <div class="preview-header">
                    <span class="preview-label">{{ decodedYaml().length }} keys decoded</span>
                    <button mat-icon-button (click)="copyYamlOutput()" matTooltip="Copy to clipboard"><mat-icon>content_copy</mat-icon></button>
                  </div>
                  <pre class="output"><code>{{ decodedYamlOutput() }}</code></pre>
                </div>
              }
              @if (yamlError()) {
                <div class="tool-error"><mat-icon>error_outline</mat-icon> {{ yamlError() }}</div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .tool-title { font-size:1.2rem;font-weight:700 }
    .tool-sub { font-size:.8rem;color:var(--msv-text-muted);margin-bottom:2px }
    .tool-divider { border-top:1px solid var(--msv-border);margin:14px 0 12px }
    .tool-error { display:flex;align-items:center;gap:8px;color:var(--msv-error);font-size:.82rem;padding:8px 12px;background:var(--msv-error-bg);border-radius:8px;margin-top:10px }
    .tool-card { padding:20px 24px }
    .tab-content { padding-top:16px }
    .input-label { font-size:.8rem;font-weight:500;margin-bottom:6px;color:var(--msv-text) }
    .code-input { width:100%;height:200px;font-family:'SF Mono','Consolas',monospace;font-size:.8rem;padding:12px;border:1px solid var(--msv-border);border-radius:8px;resize:vertical;background:#fafbfc;outline:none }
    .code-input:focus { border-color:var(--msv-primary) }
    .action-bar { display:flex;gap:12px;align-items:center;margin-top:12px;flex-wrap:wrap }
    .preview-section { margin-top:16px;border:1px solid var(--msv-border);border-radius:8px;overflow:hidden }
    .preview-header { display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--msv-surface-2);border-bottom:1px solid var(--msv-border) }
    .preview-label { font-size:.78rem;font-weight:500;color:var(--msv-text-muted) }
    .output { padding:16px;margin:0;font-family:'SF Mono','Consolas',monospace;font-size:.78rem;line-height:1.5;white-space:pre-wrap;word-break:break-all;max-height:400px;overflow-y:auto;background:var(--msv-surface) }
    .output code { color:var(--msv-text) }
    .yaml-input { height:220px }
    ::ng-deep .mat-mdc-tab-body-content { overflow:hidden !important }
  `]
})
export class K8sGeneratorComponent {
  private clipboard = inject(Clipboard);
  private snack = inject(MatSnackBar);

  activeTab = 0;

  // === .env → K8s ===
  envInput = signal('');
  secretName = signal('app-secrets');
  namespace = signal('default');

  parsedEnv = computed<Array<{key: string; value: string}>>(() => {
    return parseEnv(this.envInput());
  });

  envToKubectl = computed(() => {
    const ns = this.namespace() || 'default';
    const name = this.secretName() || 'app-secrets';
    const pairs = this.parsedEnv();
    if (!pairs.length) return '';
    const literals = pairs.map(p => `  --from-literal=${p.key}='${p.value}' \\`).join('\n');
    return `kubectl create secret generic ${name} -n ${ns} \\\n${literals.slice(0, -2)}`;
  });

  envToSecretYaml = computed(() => {
    const ns = this.namespace() || 'default';
    const name = this.secretName() || 'app-secrets';
    const pairs = this.parsedEnv();
    if (!pairs.length) return '';
    const entries = pairs.map(p => `  ${p.key}: ${btoa(p.value)}`).join('\n');
    return `apiVersion: v1\nkind: Secret\nmetadata:\n  name: ${name}\n  namespace: ${ns}\ntype: Opaque\ndata:\n${entries}`;
  });

  envToConfigMapYaml = computed(() => {
    const ns = this.namespace() || 'default';
    const name = (this.secretName() || 'app-config') + '-config';
    const pairs = this.parsedEnv();
    if (!pairs.length) return '';
    const entries = pairs.map(p => `  ${p.key}: "${p.value}"`).join('\n');
    return `apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: ${name}\n  namespace: ${ns}\ndata:\n${entries}`;
  });

  envToDockerRun = computed(() => {
    const pairs = this.parsedEnv();
    if (!pairs.length) return '';
    const flags = pairs.map(p => `  -e ${p.key}='${p.value}' \\`).join('\n');
    return `docker run \\\n${flags.slice(0, -2)} \\\n  your-image:latest`;
  });

  envToComposeEnv = computed(() => {
    const pairs = this.parsedEnv();
    if (!pairs.length) return '';
    const vars = pairs.map(p => `      - ${p.key}=${p.value}`).join('\n');
    return `services:\n  app:\n    image: your-image:latest\n    environment:\n${vars}`;
  });

  pasteSampleEnv() {
    this.envInput.set('DATABASE_URL=postgres://user:pass@host:5432/db\nAPI_KEY=sk-abc123xyz789\nREDIS_PASSWORD=s3cret!r3d1s\nNODE_ENV=production\nLOG_LEVEL=info\nPORT=3000\nCORS_ORIGIN=https://app.example.com\nJWT_SECRET=super-secret-jwt-key-change-me');
  }

  copyEnvOutput() {
    // simplified: copy kubectl by default
    const text = this.envToKubectl();
    this.clipboard.copy(text);
    this.snack.open('Copied to clipboard', 'Dismiss', { duration: 2000 });
  }

  // === K8s Secret YAML → .env ===
  yamlInput = signal('');
  yamlError = signal('');

  decodedYaml = computed<Array<{key: string; value: string}>>(() => {
    this.yamlError.set('');
    const raw = this.yamlInput().trim();
    if (!raw) return [];
    try {
      return parseSecretYaml(raw);
    } catch (e) {
      this.yamlError.set(e instanceof Error ? e.message : 'Invalid YAML');
      return [];
    }
  });

  decodedYamlOutput = computed(() => {
    return this.decodedYaml().map(p => `${p.key}=${p.value}`).join('\n');
  });

  pasteSampleYaml() {
    this.yamlInput.set('apiVersion: v1\nkind: Secret\nmetadata:\n  name: app-secrets\n  namespace: default\ndata:\n  DATABASE_URL: cG9zdGdyZXM6Ly91c2VyOnBhc3NAaG9zdDo1NDMyL2Ri\n  API_KEY: c2stYWJjMTIzeHl6Nzg5\n  REDIS_PASSWORD: czNjcmV0IXIzZDFz\n  NODE_ENV: cHJvZHVjdGlvbg==');
  }

  copyYamlOutput() {
    const text = this.decodedYamlOutput();
    if (text) {
      this.clipboard.copy(text);
      this.snack.open('Copied to clipboard', 'Dismiss', { duration: 2000 });
    }
  }

  tabChanged(idx: number) {
    this.activeTab = idx;
  }
}

// ---- Pure functions ----

function parseEnv(raw: string): Array<{key: string; value: string}> {
  return raw.trim().split('\n')
    .filter(line => line.trim() && !line.trim().startsWith('#'))
    .map(line => {
      const eq = line.indexOf('=');
      if (eq === -1) return null;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      // Strip optional quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      return key ? { key, value } : null;
    })
    .filter((e): e is {key: string; value: string} => e !== null);
}

function parseSecretYaml(raw: string): Array<{key: string; value: string}> {
  // Simple line-based parser for K8s Secret YAML (data block only)
  let inData = false;
  const pairs: Array<{key: string; value: string}> = [];

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === 'data:' || trimmed.startsWith('data:')) { inData = true; continue; }
    if (!inData) continue;
    // Stop at --- or next top-level key
    if (!trimmed.startsWith(' ') && !trimmed.startsWith('\t') && trimmed !== '') { inData = false; continue; }
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();
    if (!key || !value) continue;
    try {
      const decoded = atob(value);
      pairs.push({ key, value: decoded });
    } catch {
      pairs.push({ key, value: '[base64 decode failed]' });
    }
  }

  if (!pairs.length) throw new Error('No `data:` keys found in YAML');
  return pairs;
}
