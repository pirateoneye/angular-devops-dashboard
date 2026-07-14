import {
  Component,
  inject,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../module/material.module';
import { firstValueFrom } from 'rxjs';

// ---------------------------------------------------------------------------
// DNS models
// ---------------------------------------------------------------------------
type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SOA' | 'PTR' | 'SRV';

interface DnsRecord {
  type: DnsRecordType;
  name: string;
  value: string;
  ttl: number;
}

interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

/** One domain card in the console. */
interface DnsCard {
  domain: string;
  records: DnsRecord[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: number | null; // epoch ms
}

// ---------------------------------------------------------------------------
// Cloudflare DoH
// ---------------------------------------------------------------------------
const DOH_BASE = 'https://cloudflare-dns.com/dns-query';

function parseAnswers(answers: DnsAnswer[]): DnsRecord[] {
  return answers.map((a) => {
    const typeMap: Record<number, DnsRecordType> = {
      1: 'A', 28: 'AAAA', 5: 'CNAME', 15: 'MX',
      16: 'TXT', 2: 'NS', 6: 'SOA', 12: 'PTR', 33: 'SRV',
    };
    return {
      type: typeMap[a.type] ?? ('UNKNOWN' as DnsRecordType),
      name: a.name,
      value: a.data,
      ttl: a.TTL,
    };
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface Toast {
  id: number;
  msg: string;
  type: 'ok' | 'err' | 'info';
}

@Component({
  standalone: true,
  selector: 'app-dns-query',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './dns-query.component.html',
  styleUrl: './dns-query.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DnsQueryComponent implements OnDestroy {
  private readonly http = inject(HttpClient);

  readonly cards = signal<DnsCard[]>([]);
  readonly newDomain = signal('');

  // Quick-add presets
  readonly domainPresets = ['google.com', 'github.com', 'cloudflare.com'];

  // Filter
  readonly rrTypeFilter = signal<DnsRecordType | 'ALL'>('ALL');
  readonly rrTypes: (DnsRecordType | 'ALL')[] = ['ALL', 'A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'PTR', 'SRV'];
  // Copy
  readonly copiedId = signal('');
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  // Toasts
  readonly toasts: Toast[] = [];
  private toastId = 0;
  private readonly toastTimers = new Set<ReturnType<typeof setTimeout>>();


  readonly visibleRecords = (card: DnsCard): DnsRecord[] => {
    const f = this.rrTypeFilter();
    return f === 'ALL' ? card.records : card.records.filter((r) => r.type === f);
  };

  // -------------------------------------------------------------------
  // Domain management
  // -------------------------------------------------------------------
  addDomain(): void {
    const raw = this.newDomain().trim();
    if (!raw) return;
    // Allow comma-separated
    const domains = raw
      .split(/[,;\s]+/)
      .map((d) => d.trim())
      .filter(Boolean);
    for (const d of domains) {
      if (this.cards().some((c) => c.domain === d)) continue;
      const card: DnsCard = {
        domain: d,
        records: [],
        loading: true,
        refreshing: false,
        error: null,
        lastUpdated: null,
      };
      this.cards.update((prev) => [...prev, card]);
      this.queryDomain(d);
    }
    this.newDomain.set('');
  }

  removeDomain(domain: string): void {
    this.cards.update((prev) => prev.filter((c) => c.domain !== domain));
  }

  addPreset(domain: string): void {
    this.newDomain.set(domain);
    this.addDomain();
  }

  // -------------------------------------------------------------------
  // Query
  // -------------------------------------------------------------------
  async queryDomain(domain: string): Promise<void> {
    const card = this.cards().find((c) => c.domain === domain);
    if (!card) return;

    this.updateCard(domain, { loading: true, error: null });
    try {
      const url = `${DOH_BASE}?name=${encodeURIComponent(domain)}&type=255`; // ANY
      const res = await firstValueFrom(
        this.http.get<{ Answer?: DnsAnswer[] }>(url, {
          headers: { Accept: 'application/dns-json' },
        }),
      );
      const records = parseAnswers(res.Answer ?? []);
      this.updateCard(domain, {
        records,
        loading: false,
        refreshing: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.updateCard(domain, {
        records: [],
        loading: false,
        refreshing: false,
        error: msg,
        lastUpdated: Date.now(),
      });
    }
  }

  async refreshDomain(domain: string): Promise<void> {
    this.updateCard(domain, { refreshing: true });
    await this.queryDomain(domain);
  }

  async queryAll(): Promise<void> {
    for (const c of this.cards()) {
      this.updateCard(c.domain, { loading: true, error: null });
      this.queryDomain(c.domain);
    }
  }

  private updateCard(domain: string, patch: Partial<DnsCard>): void {
    this.cards.update((prev) =>
      prev.map((c) => (c.domain === domain ? { ...c, ...patch } : c)),
    );
  }

  // -------------------------------------------------------------------
  // Copy
  // -------------------------------------------------------------------
  copyText(text: string): void {
    navigator.clipboard.writeText(text).then(
      () => {
        this.copiedId.set(text);
        if (this.copyTimer) clearTimeout(this.copyTimer);
        this.copyTimer = setTimeout(() => {
          this.copiedId.set('');
          this.copyTimer = null;
        }, 1500);
      },
      () => this.toast('Copy failed', 'err'),
    );
  }

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------
  lastUpdated(card: DnsCard): string {
    if (!card.lastUpdated) return '';
    return new Date(card.lastUpdated).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  recordCountByType(card: DnsCard, type: DnsRecordType): number {
    return card.records.filter((r) => r.type === type).length;
  }

  uniqueTypes(card: DnsCard): DnsRecordType[] {
    const set = new Set(card.records.map((r) => r.type));
    return [...set].sort();
  }

  typeCounts(card: DnsCard): { type: DnsRecordType; count: number }[] {
    return this.uniqueTypes(card).map((t) => ({
      type: t,
      count: this.recordCountByType(card, t),
    }));
  }

  totalRecords(card: DnsCard): number {
    return card.records.length;
  }

  trackDomain(_: number, c: DnsCard): string {
    return c.domain;
  }

  trackRecord(_: number, r: DnsRecord): string {
    return `${r.type}:${r.name}:${r.value}`;
  }

  // -------------------------------------------------------------------
  // Toasts
  // -------------------------------------------------------------------
  private toast(msg: string, type: 'ok' | 'err' | 'info'): void {
    const id = ++this.toastId;
    this.toasts.push({ id, msg, type });
    const t = setTimeout(() => {
      const i = this.toasts.findIndex((x) => x.id === id);
      if (i >= 0) this.toasts.splice(i, 1);
      this.toastTimers.delete(t);
    }, 3500);
    this.toastTimers.add(t);
  }

  dismissToast(id: number): void {
    const i = this.toasts.findIndex((x) => x.id === id);
    if (i >= 0) this.toasts.splice(i, 1);
  }

  ngOnDestroy(): void {
    this.toastTimers.forEach((t) => clearTimeout(t));
    this.toastTimers.clear();
    if (this.copyTimer) clearTimeout(this.copyTimer);
  }
}
