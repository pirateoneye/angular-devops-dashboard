import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import * as forge from 'node-forge';

interface CertInfo {
  subject: string;
  issuer: string;
  notBefore: Date;
  notAfter: Date;
  daysLeft: number;
  san: string[];
  fingerprints: { sha1: string; sha256: string };
  serialNumber: string;
  bits: number;
}

@Component({
  standalone: true,
  selector: 'app-ssl-check',
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  template: `
    <div class="container pt-3 pb-3" style="max-width:640px">
      <mat-card class="tool-card">
        <h2 class="tool-title">SSL Cert Check</h2>
        <p class="tool-sub">Paste sertifikat PEM — langsung tampil detail & masa aktif</p>
        <div class="tool-divider"></div>

        <textarea
          style="width:100%;height:200px;font-family:monospace;font-size:0.78rem;padding:14px;border:1px solid var(--msv-border);border-radius:8px;resize:vertical;background:#fafbfc"
          placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDXTCCAkWgAwIBAg...&#10;-----END CERTIFICATE-----"
          [(ngModel)]="pem"
        ></textarea>

        @if (pem().includes('-----BEGIN CERTIFICATE-----') && !info()) {
          <div class="tool-error" style="margin-top:10px" role="alert">
            <mat-icon>error_outline</mat-icon> Format sertifikat tidak valid — paste PEM lengkap
          </div>
        }

        @if (info(); as i) {
          <div class="result-section">
            <div class="stat-days" [class.expired]="i.daysLeft <= 0">
              <div class="num" [style.color]="i.daysLeft > 30 ? 'var(--msv-success)' : i.daysLeft > 7 ? 'var(--msv-warning)' : 'var(--msv-error)'">
                {{ i.daysLeft }}
              </div>
              <div class="meta">
                <div><strong>Subject:</strong> {{ i.subject }}</div>
                <div><strong>Issuer:</strong> {{ i.issuer }}</div>
                <div>{{ i.notBefore | date:'dd MMM yyyy' }} — {{ i.notAfter | date:'dd MMM yyyy' }}</div>
                <div [style.color]="i.daysLeft > 0 ? 'var(--msv-success)' : 'var(--msv-error)'">
                  {{ i.daysLeft > 0 ? '✅ Valid' : '❌ Expired' }}
                </div>
              </div>
            </div>

            <div class="stats-grid">
              <div class="cell"><div>Serial</div><code>{{ i.serialNumber }}</code></div>
              <div class="cell"><div>Key Size</div><strong>{{ i.bits }}-bit</strong></div>
              <div class="cell w2">
                <div>SAN</div>
                <div class="tags">
                  @for (s of i.san.slice(0, 20); track s) { <span>{{ s }}</span> }
                  @if (i.san.length > 20) { <span>+{{ i.san.length - 20 }} more</span> }
                </div>
              </div>
              <div class="cell"><div>SHA1</div><code class="small">{{ i.fingerprints.sha1 }}</code></div>
              <div class="cell"><div>SHA256</div><code class="small">{{ i.fingerprints.sha256 }}</code></div>
            </div>
          </div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .tool-title { font-size: 1.25rem; font-weight: 700; }
    .tool-sub { font-size: 0.82rem; color: var(--msv-text-muted); margin-bottom: 2px; }
    .tool-divider { border-top: 1px solid var(--msv-border); margin: 14px 0; }
    .tool-error { display:flex;align-items:center;gap:8px;color:var(--msv-error);font-size:0.82rem;padding:8px 12px;background:var(--msv-error-bg);border-radius:8px; }
    .tool-card { padding: 20px 24px; }

    .result-section { margin-top: 16px; display:flex; flex-direction:column; gap:14px; }

    .stat-days { display:flex;align-items:center;gap:16px;padding:18px 20px;border-radius:12px;border:1px solid var(--msv-border);background:var(--msv-surface-2); }
    .stat-days.expired { background:var(--msv-error-bg);border-color:#fecaca; }
    .stat-days .num { font-size:3.2rem;font-weight:800;line-height:1; }
    .stat-days .meta { font-size:0.8rem;color:var(--msv-text-muted); display:flex;flex-direction:column;gap:2px; }
    .stat-days .meta strong { color:var(--msv-text); }

    .stats-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px; }
    .stats-grid .cell { padding:12px 14px;border-radius:10px;border:1px solid var(--msv-border);background:var(--msv-surface-2); }
    .stats-grid .cell div:first-child { font-size:0.72rem;text-transform:uppercase;letter-spacing:.4px;color:var(--msv-text-muted);margin-bottom:3px; }
    .stats-grid .cell code { font-size:0.78rem;font-family:'SF Mono','Consolas',monospace;word-break:break-all; }
    .stats-grid .cell code.small { font-size:0.72rem; }
    .stats-grid .cell strong { font-size:0.84rem; }
    .stats-grid .w2 { grid-column:span 2; }

    .tags { display:flex;flex-wrap:wrap;gap:5px;margin-top:3px; }
    .tags span { font-size:0.73rem;background:#eef2ff;color:#4338ca;padding:2px 10px;border-radius:50px; }
  `]
})
export class SslCheckComponent {
  pem = signal('');

  info = computed<CertInfo | null>(() => {
    const raw = this.pem().trim();
    if (!raw.includes('-----BEGIN CERTIFICATE-----')) return null;
    try {
      const cert = forge.pki.certificateFromPem(raw);
      const notAfter = cert.validity.notAfter;
      const notBefore = cert.validity.notBefore;
      const daysLeft = Math.ceil((notAfter.getTime() - Date.now()) / 86400000);

      const cn = cert.subject.getField('CN')?.value
        || cert.subject.attributes.map((a: any) => `${a.name}=${a.value}`).join(', ')
        || 'N/A';

      const issuerCn = cert.issuer.getField('CN')?.value
        || cert.issuer.getField('O')?.value
        || cert.issuer.attributes.map((a: any) => `${a.name}=${a.value}`).join(', ')
        || 'N/A';

      const sanExt = (cert.extensions || []).find((e: any) => e.name === 'subjectAltName');
      const san = sanExt ? (sanExt.altNames || []).map((a: any) => a.value || '').filter(Boolean) : [];

      const md1 = forge.md.sha1.create();
      md1.update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes());
      const sha1 = md1.digest().toHex().match(/.{2}/g)!.join(':');

      const md256 = forge.md.sha256.create();
      md256.update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes());
      const sha256 = md256.digest().toHex().match(/.{2}/g)!.join(':');

      const bits = (cert as any).bits ?? 0;

      return {
        subject: cn,
        issuer: issuerCn,
        notBefore, notAfter, daysLeft, san,
        fingerprints: { sha1, sha256 },
        serialNumber: cert.serialNumber || 'N/A',
        bits,
      };
    } catch {
      return null;
    }
  });
}
