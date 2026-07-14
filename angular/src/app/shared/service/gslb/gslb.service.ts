import {
  Injectable,
  inject,
  computed,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, Observable, timeout, TimeoutError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DnsPoolEntry,
  GslbCard,
  GslbMember,
  GslbSite,
  GslbSnapshot,
  GslbState,
  GslbTask,
  GslbZone,
  GtmDetailRequest,
  SuspendPayload,
} from './gslb.models';

const CACHE_TTL_MS = 30_000;
const MAX_CONCURRENCY = 4;
const CALL_TIMEOUT_MS = 20_000;
const LS_TOKEN = 'gslb.token';
const LS_USER = 'gslb.username';
const LS_FILTERS = 'gslb.filters';
const LS_MONITORING = 'gslb.monitoring';

interface MonEntry {
  fqdn: string;
  zone: GslbZone;
}

function blankCard(
  fqdn: string,
  zone: GslbZone,
  kind: 'task' | 'monitor',
): GslbCard {
  return {
    fqdn,
    zone,
    kind,
    expanded: false,
    snapshot: null,
    loading: false,
    refreshing: false,
    error: null,
    lastUpdated: null,
    armed: null,
  };
}

const DNS_POOL: DnsPoolEntry[] = [
  { fqdn: 'app-alpha.gslb.example.test', zone: 'external' },
  { fqdn: 'app-beta.gslb.example.test', zone: 'external' },
  { fqdn: 'app-gamma.gslb.example.test', zone: 'external' },
  { fqdn: 'app-delta.gslb.example.test', zone: 'external' },
  { fqdn: 'app-epsilon.gslb.example.test', zone: 'external' },
  { fqdn: 'app-zeta.gslb.example.test', zone: 'external' },
  { fqdn: 'app-eta.gslb.example.test', zone: 'external' },
  { fqdn: 'app-theta.gslb.example.test', zone: 'external' },
  { fqdn: 'app-iota.gslb.example.test', zone: 'external' },
  { fqdn: 'app-kappa.gslb.example.test', zone: 'external' },
  { fqdn: 'app-lambda.gslb.example.test', zone: 'external' },
  { fqdn: 'app-mu.gslb.example.test', zone: 'external' },
  { fqdn: 'portal-edge.gslb.example.test', zone: 'external' },
  { fqdn: 'cdn-front.gslb.example.test', zone: 'external' },
  { fqdn: 'api-gw.gslb.example.test', zone: 'external' },
  { fqdn: 'svc-internal-1.intra.example.test', zone: 'internal' },
  { fqdn: 'svc-internal-2.intra.example.test', zone: 'internal' },
  { fqdn: 'svc-internal-3.intra.example.test', zone: 'internal' },
  { fqdn: 'svc-internal-4.intra.example.test', zone: 'internal' },
  { fqdn: 'svc-internal-5.intra.example.test', zone: 'internal' },
  { fqdn: 'svc-internal-6.intra.example.test', zone: 'internal' },
  { fqdn: 'svc-internal-7.intra.example.test', zone: 'internal' },
  { fqdn: 'svc-internal-8.intra.example.test', zone: 'internal' },
  { fqdn: 'core-bus.intra.example.test', zone: 'internal' },
];

export type ZoneFilter = 'all' | GslbZone;
export type SortKey = 'name' | 'updated';
interface FilterPrefs {
  search: string;
  zone: ZoneFilter;
  sort: SortKey;
}

@Injectable({ providedIn: 'root' })
export class GslbService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly base = `${environment.hostGslb}/api/gslb`;

  readonly token = signal('');
  readonly username = signal('');
  readonly authed = computed(
    () => this.token().length > 0 && this.username().length > 0,
  );
  readonly cards = signal<GslbCard[]>([]);
  readonly loadingTasks = signal(false);
  readonly search = signal('');
  readonly zoneFilter = signal<ZoneFilter>('all');
  readonly sortKey = signal<SortKey>('name');
  readonly dnsQuery = signal('');

  readonly gtmDetail = signal<Record<string, unknown> | null>(null);
  readonly gtmLoading = signal(false);
  readonly gtmError = signal<string | null>(null);
  readonly gtmMember = signal<GslbMember | null>(null);

  readonly taskCards = computed(() =>
    this.cards().filter((c) => c.kind === 'task'),
  );
  readonly monCards = computed(() =>
    this.cards().filter((c) => c.kind === 'monitor'),
  );
  readonly filteredTaskCards = computed(() =>
    this.applyFilters(this.taskCards()),
  );
  readonly monCardsExternal = computed(() =>
    this.applySearchSort(this.monCards().filter((c) => c.zone === 'external')),
  );
  readonly monCardsInternal = computed(() =>
    this.applySearchSort(this.monCards().filter((c) => c.zone === 'internal')),
  );
  readonly counts = computed(() => this.countOf(this.cards()));
  readonly taskCounts = computed(() => this.countOf(this.taskCards()));
  readonly monCountsExternal = computed(() =>
    this.countOf(this.monCardsExternal()),
  );
  readonly monCountsInternal = computed(() =>
    this.countOf(this.monCardsInternal()),
  );
  readonly monSiteColsExternal = computed<string[]>(() =>
    this.siteCols(this.monCardsExternal()),
  );
  readonly monSiteColsInternal = computed<string[]>(() =>
    this.siteCols(this.monCardsInternal()),
  );

  readonly filteredDnsPool = computed<DnsPoolEntry[]>(() => {
    const q = this.dnsQuery().trim().toLowerCase();
    const shown = new Set(this.cards().map((c) => c.fqdn));
    return DNS_POOL.filter(
      (e) => !shown.has(e.fqdn) && (!q || e.fqdn.includes(q)),
    );
  });
  readonly canAddCustomDns = computed<boolean>(() => {
    const q = this.dnsQuery().trim().toLowerCase();
    return (
      !!q &&
      !this.cards().some((c) => c.fqdn === q) &&
      !DNS_POOL.some((e) => e.fqdn === q)
    );
  });

  private readonly cache = new Map<string, GslbSnapshot>();
  private readonly inflight = new Map<string, Promise<GslbSnapshot>>();
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor() {
    this.restoreSession();
    this.restoreFilters();
    this.restoreMonitoring();
  }

  // ---- AUTH ----
  async loginWithCredentials(
    username: string,
    password: string,
    remember: boolean,
  ): Promise<boolean> {
    const u = username.trim();
    if (!u || !password) return false;
    if (true) {
      await mockDelay();
      this.token.set('dev-fake-token');
      this.username.set(u);
      if (remember && this.isBrowser) {
        localStorage.setItem(LS_TOKEN, 'dev-fake-token');
        localStorage.setItem(LS_USER, u);
      }
      return true;
    }
    const fd = new FormData();
    fd.append('username', u);
    fd.append('password', password);
    try {
      const res = await firstValueFrom(
        this.http.post<unknown>(`${environment.hostGslb}/api/login`, fd, {
          headers: new HttpHeaders({ Accept: 'application/json' }),
        }),
      );
      const token = this.parseToken(res);
      if (!token) return false;
      this.token.set(token);
      this.username.set(u);
      if (remember && this.isBrowser) {
        localStorage.setItem(LS_TOKEN, token);
        localStorage.setItem(LS_USER, u);
      }
      return true;
    } catch {
      return false;
    }
  }

  private parseToken(res: unknown): string {
    if (!res || typeof res !== 'object') return '';
    const r = res as Record<string, unknown>;
    const data =
      r['data'] && typeof r['data'] === 'object'
        ? (r['data'] as Record<string, unknown>)
        : null;
    for (const c of [
      r['token'],
      r['access_token'],
      r['authToken'],
      r['bearer'],
      data?.['token'],
      data?.['access_token'],
      data?.['authToken'],
    ]) {
      if (typeof c === 'string' && c.trim()) return c.trim();
    }
    return '';
  }

  logout(): void {
    this.token.set('');
    this.username.set('');
    this.cards.update((list) => list.filter((c) => c.kind === 'monitor'));
    this.cache.clear();
    this.inflight.clear();
    this.gtmDetail.set(null);
    if (this.isBrowser) {
      localStorage.removeItem(LS_TOKEN);
      localStorage.removeItem(LS_USER);
    }
  }

  private restoreSession(): void {
    if (!this.isBrowser) return;
    const t = localStorage.getItem(LS_TOKEN),
      u = localStorage.getItem(LS_USER);
    if (t && u) {
      this.token.set(t);
      this.username.set(u);
    }
  }

  // ---- FILTERS ----
  setSearch(v: string): void {
    this.search.set(v);
    this.persistFilters();
  }
  setZoneFilter(z: ZoneFilter): void {
    this.zoneFilter.set(z);
    this.persistFilters();
  }
  setSortKey(s: SortKey): void {
    this.sortKey.set(s);
    this.persistFilters();
  }
  clearFilters(): void {
    this.search.set('');
    this.zoneFilter.set('all');
    this.sortKey.set('name');
    this.persistFilters();
  }

  private persistFilters(): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(
        LS_FILTERS,
        JSON.stringify({
          search: this.search(),
          zone: this.zoneFilter(),
          sort: this.sortKey(),
        }),
      );
    } catch {
      /* quota */
    }
  }
  private restoreFilters(): void {
    if (!this.isBrowser) return;
    try {
      const raw = localStorage.getItem(LS_FILTERS);
      if (!raw) return;
      const p = JSON.parse(raw) as FilterPrefs;
      if (typeof p.search === 'string') this.search.set(p.search);
      if (p.zone) this.zoneFilter.set(p.zone);
      if (p.sort) this.sortKey.set(p.sort);
    } catch {
      /* bad JSON */
    }
  }

  // ---- TASKS ----
  async loadTasks(): Promise<void> {
    if (!this.authed()) return;
    if (true) {
      this.loadingTasks.set(true);
      await mockDelay();
      const tasks = mockCards();
      const taskFqdns = new Set(tasks.map((t) => t.fqdn));
      this.cards.set([
        ...tasks,
        ...this.monCards().filter((m) => !taskFqdns.has(m.fqdn)),
      ]);
      this.loadingTasks.set(false);
      return;
    }
    this.loadingTasks.set(true);
    try {
      const h = this.headers();
      const raw = await firstValueFrom(
        this.http.get<unknown>(
          `${this.base}/obj/get_task/${this.username()}?show_expired=false`,
          { headers: h },
        ),
      );
      const tasks = this.parseTasks(raw);
      const taskFqdns = new Set(tasks.map((t) => t.fqdn));
      this.cards.set([
        ...tasks,
        ...this.monCards().filter((m) => !taskFqdns.has(m.fqdn)),
      ]);
    } catch {
      this.cards.set(this.monCards());
      throw new Error('Failed to load tasks — check token / username');
    } finally {
      this.loadingTasks.set(false);
    }
  }

  private parseTasks(raw: unknown): GslbCard[] {
    if (true && isPlatformBrowser(this.platformId))
      console.debug('[gslb] get_task raw', raw);
    const tasks: GslbTask[] = Array.isArray(raw)
      ? (raw as GslbTask[])
      : ((raw as { data?: GslbTask[]; tasks?: GslbTask[] }).data ??
        (raw as { tasks?: GslbTask[] }).tasks ??
        []);
    const map = new Map<string, GslbCard>();
    for (const t of tasks) {
      if (t.status && t.status !== 'Active' && t.status !== 'active') continue;
      const payload = t.Payload ?? [];
      const zone: GslbZone = t.flag === 'internal' ? 'internal' : 'external';
      for (const p of payload) {
        const fqdn = p.FQDN;
        if (!fqdn || map.has(fqdn)) continue;
        map.set(
          fqdn,
          blankCard(
            fqdn,
            zone === 'internal' ||
              (p.VS_NAME ?? '').toUpperCase().includes('INTERNAL')
              ? 'internal'
              : 'external',
            'task',
          ),
        );
      }
      if (!payload.length && t.fqdn && !map.has(t.fqdn))
        map.set(t.fqdn, blankCard(t.fqdn, zone, 'task'));
    }
    return Array.from(map.values());
  }

  // ---- MONITORING ----
  setDnsQuery(v: string): void {
    this.dnsQuery.set(v);
  }
  addDns(entry: DnsPoolEntry): boolean {
    return this.addMonitoring(entry.fqdn, entry.zone) > 0;
  }
  addDnsCustom(fqdn: string, zone: GslbZone): boolean {
    const ok = this.addMonitoring(fqdn, zone) > 0;
    if (ok) this.dnsQuery.set('');
    return ok;
  }
  removeMonitoring(fqdn: string): void {
    this.cards.update((list) =>
      list.filter((c) => !(c.kind === 'monitor' && c.fqdn === fqdn)),
    );
    this.persistMonitoring();
  }
  clearMonitoring(): void {
    this.cards.update((list) => list.filter((c) => c.kind !== 'monitor'));
    this.persistMonitoring();
  }

  private addMonitoring(raw: string, zone: GslbZone): number {
    const fqdns = raw
      .split(/[\s,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!fqdns.length) return 0;
    const existing = new Set(this.cards().map((c) => c.fqdn));
    const fresh = Array.from(new Set(fqdns)).filter((f) => !existing.has(f));
    if (!fresh.length) return 0;
    this.cards.update((list) => [
      ...list,
      ...fresh.map((f) => blankCard(f, zone, 'monitor')),
    ]);
    this.persistMonitoring();
    return fresh.length;
  }

  private persistMonitoring(): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(
        LS_MONITORING,
        JSON.stringify(
          this.monCards().map((c) => ({ fqdn: c.fqdn, zone: c.zone })),
        ),
      );
    } catch {
      /* quota */
    }
  }
  private restoreMonitoring(): void {
    if (!this.isBrowser) return;
    try {
      const raw = localStorage.getItem(LS_MONITORING);
      if (!raw) return;
      const entries = JSON.parse(raw) as MonEntry[];
      if (!Array.isArray(entries)) return;
      const existing = new Set(this.cards().map((c) => c.fqdn));
      const toAdd = entries
        .filter((e) => e?.fqdn && !existing.has(e.fqdn))
        .map((e) =>
          blankCard(
            e.fqdn,
            e.zone === 'internal' ? 'internal' : 'external',
            'monitor',
          ),
        );
      if (toAdd.length) this.cards.update((list) => [...list, ...toAdd]);
    } catch {
      /* bad JSON */
    }
  }

  // ---- EXPAND / DETAIL ----
  toggleExpand(fqdn: string): void {
    const card = this.cards().find((c) => c.fqdn === fqdn);
    if (!card) return;
    const nowExpanded = !card.expanded;
    this.patchCard(fqdn, { expanded: nowExpanded });
    if (!nowExpanded) return;
    const snap = this.cache.get(fqdn);
    if (!snap) {
      void this.loadDetail(fqdn, { background: false });
      return;
    }
    this.patchCard(fqdn, { snapshot: snap, lastUpdated: snap.at, error: null });
    if (Date.now() - snap.at > CACHE_TTL_MS)
      void this.loadDetail(fqdn, { background: true });
  }

  async refresh(fqdn: string): Promise<void> {
    await this.loadDetail(fqdn, { background: false, force: true });
  }

  private async loadDetail(
    fqdn: string,
    opts: { background: boolean; force?: boolean },
  ): Promise<GslbSnapshot> {
    const existing = this.inflight.get(fqdn);
    if (existing && !opts.force) return existing;
    const hasCache = !!this.cache.get(fqdn),
      showSkeleton = !opts.background && !hasCache;
    this.patchCard(fqdn, {
      loading: showSkeleton,
      refreshing: opts.background || (hasCache && !showSkeleton),
      error: null,
    });
    const run = (async (): Promise<GslbSnapshot> => {
      await this.acquire();
      try {
        const snap = await this.fetchDetail(fqdn);
        this.cache.set(fqdn, snap);
        this.patchCard(fqdn, {
          snapshot: snap,
          lastUpdated: snap.at,
          loading: false,
          refreshing: false,
          error: null,
        });
        return snap;
      } catch (e) {
        this.patchCard(fqdn, (c) => ({
          loading: false,
          refreshing: false,
          error: c.snapshot
            ? null
            : e instanceof TimeoutError
              ? 'timed out'
              : 'failed to load',
        }));
        throw e;
      } finally {
        this.release();
      }
    })();
    this.inflight.set(fqdn, run);
    try {
      return await run;
    } finally {
      this.inflight.delete(fqdn);
    }
  }

  private async fetchDetail(fqdn: string): Promise<GslbSnapshot> {
    if (true) {
      await mockDelay();
      return mockSnapshot(fqdn);
    }
    const card = this.cards().find((c) => c.fqdn === fqdn);
    const type = card?.zone === 'internal' ? 'internal' : 'eksternal';
    const res = await this.callWithRetry<{
      gtm?: boolean;
      data?: GslbMember[];
    }>(
      this.http.post(
        `${this.base}/fqdn/detail?type=${type}`,
        { fqdn, position: 'current' },
        { headers: this.headers() },
      ),
    );
    const members = (res.data ?? []).map((m) => {
      const v = String(m.state ?? '').toUpperCase();
      return {
        ...m,
        site: this.parseSite(m.svc_name),
        state: (v === 'UP' ||
        v === 'DOWN' ||
        v === 'OUT OF SERVICE' ||
        v === 'SUSPENDED'
          ? v
          : 'DOWN') as GslbState,
      };
    });
    return { gtm: !!res.gtm, members, at: Date.now() };
  }

  // ---- MUTATE ----
  async unsuspend(member: GslbMember, fqdn: string): Promise<boolean> {
    return this.mutate(member, fqdn, 'UP', 'OUT OF SERVICE');
  }
  async suspend(member: GslbMember, fqdn: string): Promise<boolean> {
    return this.mutate(member, fqdn, 'SUSPENDED', 'DOWN');
  }

  private async mutate(
    member: GslbMember,
    fqdn: string,
    optimistic: GslbState,
    wireState: 'DOWN' | 'OUT OF SERVICE',
  ): Promise<boolean> {
    const card = this.cards().find((c) => c.fqdn === fqdn);
    if (!card?.snapshot) return false;
    const oldState = member.state;
    if (oldState === optimistic) return true;
    this.patchMember(fqdn, member.svc_name, { state: optimistic });
    try {
      if (true) {
        await mockDelay();
        return true;
      }
      const zone = card!.zone === 'internal' ? 'internal' : 'eksternal';
      await firstValueFrom(
        this.http.post(
          `${this.base}/fun/${wireState === 'DOWN' ? 'suspend' : 'unsuspend'}?type=${zone}`,
          {
            SVC_NAME: member.svc_name,
            SVC_STATE: wireState,
            PORT: member.svr_port,
            VS_NAME: member.vs_name ?? '',
            FQDN: fqdn,
            IP: member.svr_ip,
            GTM: member.gtm ?? true,
            requestbytesrate: member.requestbytesrate ?? 0,
            ID: member.id ?? 0,
          } as SuspendPayload,
          { headers: this.headers() },
        ),
      );
      void this.loadDetail(fqdn, { background: true, force: true });
      return true;
    } catch {
      this.patchMember(fqdn, member.svc_name, { state: oldState });
      return false;
    }
  }

  async unsuspendAll(fqdn: string): Promise<{ ok: number; fail: number }> {
    return this.mutateAll(fqdn, 'UP', 'OUT OF SERVICE');
  }
  async suspendAll(fqdn: string): Promise<{ ok: number; fail: number }> {
    return this.mutateAll(fqdn, 'SUSPENDED', 'DOWN');
  }

  private async mutateAll(
    fqdn: string,
    optimistic: GslbState,
    wireState: 'DOWN' | 'OUT OF SERVICE',
  ): Promise<{ ok: number; fail: number }> {
    const members =
      this.cards().find((c) => c.fqdn === fqdn)?.snapshot?.members ?? [];
    if (!members.length) return { ok: 0, fail: 0 };
    const prev = members.map((m) => ({ name: m.svc_name, state: m.state }));
    members.forEach((m) => {
      if (m.state !== optimistic)
        this.patchMember(fqdn, m.svc_name, { state: optimistic });
    });
    const results = await Promise.all(
      members.map((m) => this.mutate(m, fqdn, optimistic, wireState)),
    );
    const fail = results.filter((r) => !r).length;
    if (fail > 0)
      results.forEach((r, i) => {
        if (!r) this.patchMember(fqdn, prev[i].name, { state: prev[i].state });
      });
    void this.loadDetail(fqdn, { background: true, force: true });
    return { ok: results.length - fail, fail };
  }

  // ---- GTM SLIDE-OVER ----
  async openGtmDetail(member: GslbMember, fqdn: string): Promise<void> {
    this.gtmMember.set(member);
    this.gtmDetail.set(null);
    this.gtmError.set(null);
    this.gtmLoading.set(true);
    try {
      if (true) {
        await mockDelay();
        this.gtmDetail.set(mockGtm(member, fqdn));
        return;
      }
      const card = this.cards().find((c) => c.fqdn === fqdn);
      const flag = card?.zone === 'internal' ? 'internal' : 'eksternal';
      this.gtmDetail.set(
        await this.callWithRetry<Record<string, unknown>>(
          this.http.post<Record<string, unknown>>(
            `${this.base}/gtmpoolmemberdetail`,
            {
              domain: fqdn,
              pool_member_name: member.svc_name,
              flag,
            } as GtmDetailRequest,
            { headers: this.headers() },
          ),
        ),
      );
    } catch (e) {
      this.gtmError.set(
        e instanceof TimeoutError ? 'timed out' : 'failed to load GTM detail',
      );
    } finally {
      this.gtmLoading.set(false);
    }
  }

  closeGtmDetail(): void {
    this.gtmDetail.set(null);
    this.gtmMember.set(null);
    this.gtmError.set(null);
    this.gtmLoading.set(false);
  }

  // ---- HELPERS ----
  private applySearchSort(list: GslbCard[]): GslbCard[] {
    const q = this.search().trim().toLowerCase(),
      sort = this.sortKey();
    const filtered = list.filter((c) => !q || c.fqdn.toLowerCase().includes(q));
    return [...filtered].sort((a, b) =>
      sort === 'updated'
        ? (b.lastUpdated ?? 0) - (a.lastUpdated ?? 0)
        : a.fqdn.localeCompare(b.fqdn),
    );
  }

  private applyFilters(list: GslbCard[]): GslbCard[] {
    const zone = this.zoneFilter();
    return this.applySearchSort(
      zone === 'all' ? list : list.filter((c) => c.zone === zone),
    );
  }

  private countOf(list: GslbCard[]): {
    up: number;
    oos: number;
    down: number;
    susp: number;
  } {
    let up = 0,
      oos = 0,
      down = 0,
      susp = 0;
    for (const c of list) {
      if (!c.snapshot) continue;
      for (const m of c.snapshot.members) {
        if (m.state === 'UP') up++;
        else if (m.state === 'OUT OF SERVICE') oos++;
        else if (m.state === 'DOWN') down++;
        else if (m.state === 'SUSPENDED') susp++;
      }
    }
    return { up, oos, down, susp };
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.token()}`,
      'Content-Type': 'application/json',
      'X-USER': this.username(),
    });
  }

  private parseSite(svcName: string): string {
    if (!svcName) return 'default';
    const core = svcName.split('/').pop()!.split(':')[0],
      parts = core.split('_').filter(Boolean);
    return parts.length <= 1
      ? core || 'default'
      : parts[parts.length - 1] || 'default';
  }

  sitesOf(card: GslbCard): GslbSite[] {
    const members = card.snapshot?.members ?? [],
      map = new Map<string, GslbMember[]>();
    for (const m of members) {
      const site = m.site ?? this.parseSite(m.svc_name);
      if (!map.has(site)) map.set(site, []);
      map.get(site)!.push(m);
    }
    return Array.from(map, ([name, ms]) => ({
      name,
      members: ms,
      up: ms.filter((m) => m.state === 'UP').length,
      oos: ms.filter((m) => m.state === 'OUT OF SERVICE').length,
      down: ms.filter((m) => m.state === 'DOWN').length,
      susp: ms.filter((m) => m.state === 'SUSPENDED').length,
    }));
  }

  private siteCols(list: GslbCard[]): string[] {
    const set = new Set<string>();
    for (const c of list)
      for (const m of c.snapshot?.members ?? [])
        set.add(m.site ?? this.parseSite(m.svc_name));
    return Array.from(set).sort();
  }

  membersAtSite(card: GslbCard, site: string): GslbMember[] {
    return (card.snapshot?.members ?? []).filter(
      (m) => (m.site ?? this.parseSite(m.svc_name)) === site,
    );
  }

  async loadAllMonitoring(): Promise<void> {
    if (!this.authed()) return;
    await Promise.all(
      this.monCards().map((c) =>
        this.loadDetail(c.fqdn, { background: true }).catch(() => null),
      ),
    );
  }

  countState(card: GslbCard, state: GslbState): number {
    return (card.snapshot?.members ?? []).filter((m) => m.state === state)
      .length;
  }

  private async callWithRetry<T>(obs: Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(obs.pipe(timeout(CALL_TIMEOUT_MS)));
    } catch (e) {
      if (e instanceof TimeoutError)
        return await firstValueFrom(obs.pipe(timeout(CALL_TIMEOUT_MS)));
      throw e;
    }
  }

  private acquire(): Promise<void> {
    if (this.active < MAX_CONCURRENCY) {
      this.active++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) =>
      this.queue.push(() => {
        this.active++;
        resolve();
      }),
    );
  }
  private release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) next();
  }

  private patchCard(
    fqdn: string,
    patch: Partial<GslbCard> | ((c: GslbCard) => Partial<GslbCard>),
  ): void {
    this.cards.update((list) =>
      list.map((c) => {
        if (c.fqdn !== fqdn) return c;
        const p = typeof patch === 'function' ? patch(c) : patch;
        return { ...c, ...p };
      }),
    );
  }
  private patchMember(
    fqdn: string,
    svcName: string,
    patch: Partial<GslbMember>,
  ): void {
    this.cards.update((list) =>
      list.map((c) => {
        if (c.fqdn !== fqdn || !c.snapshot) return c;
        return {
          ...c,
          snapshot: {
            ...c.snapshot,
            members: c.snapshot.members.map((m) =>
              m.svc_name === svcName ? { ...m, ...patch } : m,
            ),
          },
        };
      }),
    );
  }
}

// ---- MOCK (dev only) ----
function mockDelay(): Promise<void> {
  return new Promise((r) =>
    setTimeout(r, 120 + Math.floor(Math.random() * 260)),
  );
}

function mockCards(): GslbCard[] {
  const ext = [
    'app-alpha',
    'app-beta',
    'app-gamma',
    'app-delta',
    'app-epsilon',
    'app-zeta',
    'app-eta',
    'app-theta',
  ];
  const int = [
    'svc-internal-1',
    'svc-internal-2',
    'svc-internal-3',
    'svc-internal-4',
    'svc-internal-5',
    'svc-internal-6',
  ];
  return [
    ...ext.map((n) => blankCard(`${n}.gslb.example.test`, 'external', 'task')),
    ...int.map((n) => blankCard(`${n}.intra.example.test`, 'internal', 'task')),
  ];
}

function mockSnapshot(fqdn: string): GslbSnapshot {
  const sites = [
    'WSA2',
    'WSB1',
    'WSC1',
    'GAC-AZ1',
    'GAC-AZ2',
    'DC2-AZ1',
    'DC2-AZ2',
  ];
  const app = fqdn.split('.')[0],
    members: GslbMember[] = [];
  sites.forEach((site, si) => {
    const n = 1 + ((hash(fqdn) + si) % 2);
    for (let k = 0; k < n; k++) {
      const idx = si * 2 + k,
        r = hash(fqdn + site + k) % 10;
      const state: GslbState = r < 7 ? 'UP' : r < 9 ? 'OUT OF SERVICE' : 'DOWN';
      members.push({
        svc_name: `/Common/SVR_${site}:MBR_${app}_443_${site}${k ? k : ''}`,
        svr_ip: `10.${(hash(fqdn) % 200) + 1}.${si + 1}.${k + 28}`,
        svr_port: '443',
        state,
        vs_name: `/INTERNET_0${(si % 3) + 1}/${app}/${fqdn}`,
        id: 100000000 + idx,
        gtm: true,
        requestbytesrate: r * 12,
        site,
      });
    }
  });
  return { gtm: true, members, at: Date.now() };
}

function mockGtm(member: GslbMember, fqdn: string): Record<string, unknown> {
  return {
    domain: fqdn,
    pool_member_name: member.svc_name,
    member: { ip: member.svr_ip, port: member.svr_port, state: member.state },
    pool: `/Common/${fqdn.split('.')[0].toUpperCase()}_POOL`,
    enabled: member.state !== 'DOWN',
  };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
