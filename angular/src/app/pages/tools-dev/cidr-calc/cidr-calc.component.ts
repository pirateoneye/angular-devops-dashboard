import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';

interface CidrResult { cidr: string; netmask: string; wildcard: string; network: string; broadcast: string; first: string; last: string; total: number; usable: number; }

function ipToNum(ip: string): number {
  return ip.split('.').reduce((sum, octet, i) => sum + (parseInt(octet) * Math.pow(256, 3 - i)), 0) >>> 0;
}
function numToIp(num: number): string {
  return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
}

function parseCidr(input: string): CidrResult | null {
  const m = input.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
  if (!m) return null;
  const ip = m[1]; const prefix = parseInt(m[2]);
  if (prefix < 0 || prefix > 32) return null;
  const ipNum = ipToNum(ip);
  if (ipNum === 0 && ip.split('.').some(o => parseInt(o) > 255)) return null;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const wildcard = ~mask >>> 0;
  const network = (ipNum & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const total = Math.pow(2, 32 - prefix);
  const usable = prefix > 30 ? (prefix === 32 ? 0 : total - 2) : total - 2;
  return { cidr: input.trim(), netmask: numToIp(mask), wildcard: numToIp(wildcard), network: numToIp(network), broadcast: numToIp(broadcast), first: prefix < 31 ? numToIp(network + 1) : '—', last: prefix < 31 ? numToIp(broadcast - 1) : '—', total, usable };
}

function lookupHost(host: string): string | null {
  const m = host.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  return m ? m[1] : null;
}

function findCommonCidrs(ip1: number, ip2: number): string[] {
  const results: string[] = [];
  for (let p = 24; p >= 8; p--) {
    const mask = (~0 << (32 - p)) >>> 0;
    if ((ip1 & mask) === (ip2 & mask)) {
      results.push(`${numToIp(ip1 & mask)}/${p}`);
    }
  }
  return results;
}

@Component({ standalone: true, selector: 'app-cidr-calc',
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSnackBarModule],
  template: `
    <div class="container pt-3 pb-3" style="max-width:640px">
      <mat-card class="tool-card"><h2 class="tool-title">CIDR Subnet Calculator</h2>
        <p class="tool-sub">IP subnetting, range, netmask, wildcard</p><div class="tool-divider"></div>

        <div class="bar"><mat-form-field appearance="outline" style="flex:1;max-width:280px"><mat-label>CIDR</mat-label>
          <input matInput [(ngModel)]="cidrInput" placeholder="192.168.1.0/24" (keydown.enter)="calculate()"></mat-form-field>
          <button mat-raised-button color="primary" (click)="calculate()" [disabled]="!cidrInput().trim()"><mat-icon>calculate</mat-icon> Calculate</button></div>

        @if (error()) { <div class="err"><mat-icon>error_outline</mat-icon> {{error()}}</div> }

        @if (result(); as r) {
          <div class="grid"><div class="cell"><div class="lbl">CIDR</div><div class="val mono">{{r.cidr}}</div></div>
          <div class="cell"><div class="lbl">Netmask</div><div class="val mono">{{r.netmask}}</div></div>
          <div class="cell"><div class="lbl">Wildcard</div><div class="val mono">{{r.wildcard}}</div></div>
          <div class="cell"><div class="lbl">Network</div><div class="val mono">{{r.network}}</div></div>
          <div class="cell"><div class="lbl">Broadcast</div><div class="val mono">{{r.broadcast}}</div></div>
          <div class="cell"><div class="lbl">First Usable</div><div class="val mono">{{r.first}}</div></div>
          <div class="cell"><div class="lbl">Last Usable</div><div class="val mono">{{r.last}}</div></div>
          <div class="cell"><div class="lbl">Total IPs</div><div class="val">{{r.total | number}}</div></div>
          <div class="cell highlight"><div class="lbl">Usable IPs</div><div class="val">{{r.usable | number}}</div></div></div>}

        <div class="tool-divider"></div>
        <div class="bar"><mat-form-field appearance="outline" style="flex:1;max-width:180px"><mat-label>IP 1</mat-label>
          <input matInput [(ngModel)]="ip1" placeholder="10.0.0.5"></mat-form-field>
          <mat-form-field appearance="outline" style="flex:1;max-width:180px"><mat-label>IP 2</mat-label>
          <input matInput [(ngModel)]="ip2" placeholder="10.0.0.25"></mat-form-field>
          <button mat-stroked-button color="primary" (click)="compareIps()">Common CIDRs</button></div>

        @if (commonCidrs().length > 0) {
          <div class="preview-section"><div class="preview-header"><span>Common CIDRs</span>
            <button mat-icon-button (click)="copyCommonCidrs()" matTooltip="Copy"><mat-icon>content_copy</mat-icon></button></div>
          <pre class="output"><code>{{commonCidrs().join('\n')}}</code></pre></div>}
      </mat-card></div>
  `, styles: [`
    .tool-title{font-size:1.2rem;font-weight:700}.tool-sub{font-size:.8rem;color:var(--msv-text-muted);margin-bottom:2px}.tool-divider{border-top:1px solid var(--msv-border);margin:14px 0}.tool-card{padding:20px 24px}.bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.err{display:flex;align-items:center;gap:8px;color:var(--msv-error);font-size:.82rem;padding:8px 12px;background:var(--msv-error-bg);border-radius:8px;margin-top:10px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.cell{padding:14px;border-radius:10px;border:1px solid var(--msv-border);background:var(--msv-surface-2);text-align:center}.cell.highlight{border-left:3px solid var(--msv-primary)} .cell .lbl{font-size:.7rem;text-transform:uppercase;letter-spacing:.4px;color:var(--msv-text-muted);margin-bottom:3px}.cell .val{font-size:1.1rem;font-weight:700}.cell .val.mono{font-size:.82rem;font-family:'SF Mono','Consolas',monospace}.preview-section{margin-top:10px;border:1px solid var(--msv-border);border-radius:8px;overflow:hidden}.preview-header{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:var(--msv-surface-2);border-bottom:1px solid var(--msv-border);font-size:.78rem;color:var(--msv-text-muted)}.output{padding:12px 16px;margin:0;font-family:'SF Mono','Consolas',monospace;font-size:.78rem;line-height:1.6;max-height:200px;overflow-y:auto;background:var(--msv-surface);white-space:pre}
  `]
})
export class CidrCalcComponent {
  private snack=inject(MatSnackBar);private clipboard=inject(Clipboard);
  cidrInput=signal('');error=signal('');ip1=signal('');ip2=signal('');commonCidrs=signal<string[]>([]);
  result=computed<CidrResult|null>(()=>null);  // triggered manually

  calculate() { const v=this.cidrInput().trim();if(!v){this.error.set('');return}const r=parseCidr(v);if(!r){this.error.set('Invalid CIDR — use format IP/prefix, e.g. 192.168.1.0/24');return}this.error.set('');this.result=computed(()=>r) as any; }
  compareIps() { const a=lookupHost(this.ip1().trim());const b=lookupHost(this.ip2().trim());if(!a||!b){this.snack.open('Enter valid IP addresses','Dismiss',{duration:2000});return}this.commonCidrs.set(findCommonCidrs(ipToNum(a),ipToNum(b))); }
  copyCommonCidrs() { const t=this.commonCidrs().join('\n');if(t){this.clipboard.copy(t);this.snack.open('Copied','Dismiss',{duration:1500});} }
}
