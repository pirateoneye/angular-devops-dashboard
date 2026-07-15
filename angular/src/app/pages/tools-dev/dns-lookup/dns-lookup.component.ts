import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EmptyStateComponent } from '../../../shared/component/empty-state/empty-state.component';

interface DnsRecord { type: string; name: string; value: string; ttl: number; }

@Component({
  standalone: true,
  selector: 'app-dns-lookup',
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatTableModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
    MatProgressSpinnerModule, MatSnackBarModule, EmptyStateComponent],
  template: `
    <div class="container pt-3 pb-3" style="max-width:720px">
      <mat-card class="tool-card">
        <h2 class="tool-title">DNS Lookup</h2>
        <p class="tool-sub">Query DNS records via Cloudflare DNS-over-HTTPS (1.1.1.1)</p>
        <div class="tool-divider"></div>

        <div class="query-row">
          <mat-form-field appearance="outline" style="flex:1;max-width:300px">
            <mat-label>Domain</mat-label>
            <input matInput [(ngModel)]="domain" placeholder="google.com" (keydown.enter)="query()">
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:140px">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="rrType">
              @for (t of types; track t) { <mat-option [value]="t">{{ t }}</mat-option> }
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="query()" [disabled]="loading() || !domain().trim()">
            @if (loading()) { <mat-spinner diameter="18" style="display:inline-block;margin-right:4px"></mat-spinner> }
            Lookup
          </button>
        </div>

        @if (error()) {
          <div class="tool-error" role="alert"><mat-icon>error_outline</mat-icon> {{ error() }}</div>
        }
        @if (!loading() && records().length === 0 && !error() && queried) {
          <omp-empty-state message="Tidak ada record DNS ditemukan untuk domain ini." icon="dns" />
        }

        @if (records().length > 0) {
          <table mat-table [dataSource]="records()" class="dns-table" style="width:100%;margin-top:12px">
            <ng-container matColumnDef="type"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let r">{{ r.type }}</td></ng-container>
            <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let r">{{ r.name }}</td></ng-container>
            <ng-container matColumnDef="value"><th mat-header-cell *matHeaderCellDef>Value</th><td mat-cell *matCellDef="let r" class="mono">{{ r.value }}</td></ng-container>
            <ng-container matColumnDef="ttl"><th mat-header-cell *matHeaderCellDef>TTL</th><td mat-cell *matCellDef="let r">{{ r.ttl }}s</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let r; columns: columns"></tr>
          </table>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .tool-title { font-size:1.2rem;font-weight:700 }
    .tool-sub { font-size:.8rem;color:var(--msv-text-muted);margin-bottom:2px }
    .tool-divider { border-top:1px solid var(--msv-border);margin:14px 0 }
    .tool-error { display:flex;align-items:center;gap:8px;color:var(--msv-error);font-size:.82rem;padding:8px 12px;background:var(--msv-error-bg);border-radius:8px;margin-top:10px }
    .tool-card { padding:20px 24px }
    .query-row { display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap }
    .dns-table th { font-weight:600;font-size:.78rem;color:var(--msv-text-muted);text-transform:uppercase;letter-spacing:.3px }
    .dns-table td { font-size:.82rem }
    .mono { font-family:'SF Mono','Consolas',monospace;font-size:.78rem;word-break:break-all }
  `]
})
export class DnsLookupComponent {
  private http = inject(HttpClient);
  private snack = inject(MatSnackBar);
  queried = false;
  domain = signal('');
  rrType = signal('A');
  types = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'PTR', 'SRV'];
  loading = signal(false);
  error = signal('');
  records = signal<DnsRecord[]>([]);
  columns = ['type', 'name', 'value', 'ttl'];

  query() {
    const d = this.domain().trim();
    this.loading.set(true); this.error.set(''); this.records.set([]); this.queried = true;
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(d)}&type=${this.rrType()}`;
    this.http.get<{Answer?: DnsRecord[]}>(url, { headers: { Accept: 'application/dns-json' } }).subscribe({
      next: r => {
        this.records.set(r.Answer || []);
        if (!r.Answer?.length) this.snack.open('No records found for ' + this.rrType(), 'Dismiss', { duration: 3000 });
        this.loading.set(false);
      },
      error: e => { this.error.set(e.message); this.loading.set(false); }
    });
  }
}
