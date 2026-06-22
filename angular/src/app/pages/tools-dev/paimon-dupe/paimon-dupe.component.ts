import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  computed,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';


type ServiceState = 'UP' | 'OUT OF SERVICE' | 'DOWN';
type DnsZone = 'internal' | 'external';

interface Service {
  svc_name: string;
  svr_ip: string;
  svr_port: string;
  state: ServiceState;
  vs_name?: string;
  id?: number;
}

interface UserTask {
  no: number;
  Payload: {
    FQDN: string;
    SR: number;
    SVC_NAME: string;
    SVC_STATE: string | null;
    SVC_TYPE: string;
    SVR_IP: string;
    SVC_PORT: string;
    VS_NAME: string;
    GTM: boolean;
  }[];
  flag: string;
  fqdn: string;
  Changeid: number;
  start_time: string;
  end_time: string;
  status: string;
  as_api: number;
}

interface DnsEntry {
  fqdn: string;
  zone: DnsZone;
  services: Service[];
  isLoading: boolean;
  lastUpdated: Date | null;
  isExpanded: boolean;
}

interface PoolItem {
  fqdn: string;
  zone: DnsZone;
}

interface Toast {
  id: number;
  msg: string;
  type: 'ok' | 'err' | 'info';
}
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../module/material.module';
import { MsvFormsModule } from '../../../shared/components/msv-forms/msv-forms.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MaterialModule, MsvFormsModule, MatSlideToggleModule, InfiniteScrollModule],
  selector: 'app-paimon-dupe',
  templateUrl: './paimon-dupe.component.html',
  styleUrl: './paimon-dupe.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class PaimonDupeComponent {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private toastCounter = 0;

  // Base DNS pool for MONITORING (view-only)
  readonly MONITORING_POOL: PoolItem[] = [
    { fqdn: 'image.merchant-bca.intra.bca.co.id', zone: 'internal' },
    { fqdn: 'ebanksvc.sc.bca.co.id', zone: 'external' },
  ];

  // State
  readonly token = signal('');
  readonly username = signal('');
  readonly baseUrl = signal('https://your-api.com/api/gslb');
  readonly loading = signal(false);

  // TASK DNS - from get_task API (can suspend/unsuspend)
  readonly taskDnsList = signal<DnsEntry[]>([]);

  // MONITORING DNS - selected from pool (view-only)
  readonly monitoringDnsList = signal<DnsEntry[]>([]);
  readonly selectedMonitoring = signal<Set<string>>(new Set());

  // Selected services for bulk actions (only for task DNS)
  readonly selectedSvc = signal<Set<string>>(new Set());

  // UI
  readonly showLogin = signal(false);
  readonly toasts = signal<Toast[]>([]);
  readonly taskTab = signal<DnsZone>('internal');
  readonly monitorTab = signal<DnsZone>('internal');

  // Form
  readonly form = this.fb.group({
    token: ['', [Validators.required, Validators.minLength(10)]],
    username: ['', [Validators.required, Validators.minLength(2)]],
    baseUrl: ['https://your-api.com/api/gslb', Validators.required],
    remember: [true],
  });

  // Computed
  readonly loggedIn = computed(() => this.token().length > 0 && this.username().length > 0);

  // Task DNS by zone
  readonly taskInternal = computed(() => this.taskDnsList().filter((d) => d.zone === 'internal'));
  readonly taskExternal = computed(() => this.taskDnsList().filter((d) => d.zone === 'external'));
  readonly currentTaskDns = computed(() => (this.taskTab() === 'internal' ? this.taskInternal() : this.taskExternal()));

  // Monitoring DNS by zone
  readonly monitorInternal = computed(() => this.monitoringDnsList().filter((d) => d.zone === 'internal'));
  readonly monitorExternal = computed(() => this.monitoringDnsList().filter((d) => d.zone === 'external'));
  readonly currentMonitorDns = computed(() => (this.monitorTab() === 'internal' ? this.monitorInternal() : this.monitorExternal()));

  // Monitoring pool by zone (exclude already in task)
  readonly poolInternal = computed(() => {
    const taskFqdns = new Set(this.taskDnsList().map((d) => d.fqdn));
    return this.MONITORING_POOL.filter((p) => p.zone === 'internal' && !taskFqdns.has(p.fqdn));
  });
  readonly poolExternal = computed(() => {
    const taskFqdns = new Set(this.taskDnsList().map((d) => d.fqdn));
    return this.MONITORING_POOL.filter((p) => p.zone === 'external' && !taskFqdns.has(p.fqdn));
  });

  // Stats for task DNS
  readonly upCount = computed(() => this.taskDnsList().reduce((n, d) => n + d.services.filter((s) => s.state === 'UP').length, 0));
  readonly oosCount = computed(() => this.taskDnsList().reduce((n, d) => n + d.services.filter((s) => s.state === 'OUT OF SERVICE').length, 0));
  readonly downCount = computed(() => this.taskDnsList().reduce((n, d) => n + d.services.filter((s) => s.state === 'DOWN').length, 0));

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  ngOnInit(): void {
    this.loadConfig();
    // Show login popup if not logged in (after loadConfig has run)
    if (!this.loggedIn()) {
      this.showLogin.set(true);
    }
  }

  // ============================================================================
  // CONFIG
  // ============================================================================

  private loadConfig(): void {
    if (!this.isBrowser) {
      // On SSR, always show login popup
      this.showLogin.set(true);
      return;
    }
    const t = localStorage.getItem('sus_token');
    const u = localStorage.getItem('sus_username');
    const b = localStorage.getItem('sus_baseUrl');
    if (t) this.token.set(t);
    if (u) this.username.set(u);
    if (b) this.baseUrl.set(b);

    // Show login popup if no saved credentials
    if (!t || !u) {
      this.showLogin.set(true);
    } else {
      this.fetchTasks();
    }
  }

  login(): void {
    if (!this.form.valid) return;
    const { token, username, baseUrl, remember } = this.form.value;
    this.token.set(token!);
    this.username.set(username!);
    this.baseUrl.set(baseUrl!);
    if (remember && this.isBrowser) {
      localStorage.setItem('sus_token', token!);
      localStorage.setItem('sus_username', username!);
      localStorage.setItem('sus_baseUrl', baseUrl!);
    }
    this.showLogin.set(false);
    this.notify('Connected', 'ok');
    this.fetchTasks();
  }

  logout(): void {
    this.token.set('');
    this.username.set('');
    this.taskDnsList.set([]);
    this.monitoringDnsList.set([]);
    this.selectedMonitoring.set(new Set());
    if (this.isBrowser) {
      localStorage.removeItem('sus_token');
      localStorage.removeItem('sus_username');
    }
    this.showLogin.set(true);
    this.notify('Logged out', 'info');
  }

  // ============================================================================
  // FETCH TASKS (Task DNS)
  // ============================================================================

  async fetchTasks(): Promise<void> {
    this.loading.set(true);
    try {
      const h = new HttpHeaders({
        Authorization: `Bearer ${this.token()}`,
        'Content-Type': 'application/json',
        'X-USER': this.username(),
      });
      const url = `${this.baseUrl()}/obj/get_task/${this.username()}?show_expired=false`;
      const tasks = await firstValueFrom(this.http.get<UserTask[]>(url, { headers: h }));
      this.processTasks(tasks);
      this.notify(`${tasks.length} tasks loaded`, 'ok');
    } catch {
      this.taskDnsList.set([]);
      this.notify('No tasks found', 'info');
    } finally {
      this.loading.set(false);
    }
  }

  private processTasks(tasks: UserTask[]): void {
    const dnsMap = new Map<string, DnsEntry>();

    for (const t of tasks) {
      if (t.status !== 'Active') continue;
      for (const p of t.Payload) {
        const zone: DnsZone = t.flag === 'internal' || p.VS_NAME.toUpperCase().includes('INTERNAL') ? 'internal' : 'external';
        const key = `${p.FQDN}-${zone}`;
        if (!dnsMap.has(key)) {
          dnsMap.set(key, { fqdn: p.FQDN, zone, services: [], isLoading: false, lastUpdated: null, isExpanded: true });
        }
      }
    }

    const entries = Array.from(dnsMap.values());
    this.taskDnsList.set(entries);

    // Fetch status for each task DNS
    entries.forEach((d) => this.fetchStatus(d.fqdn, d.zone, 'task'));
  }

  // ============================================================================
  // MONITORING DNS (View-only)
  // ============================================================================

  toggleMonitoringSelection(fqdn: string): void {
    const s = new Set(this.selectedMonitoring());
    s.has(fqdn) ? s.delete(fqdn) : s.add(fqdn);
    this.selectedMonitoring.set(s);
  }

  isMonitoringSelected(fqdn: string): boolean {
    return this.selectedMonitoring().has(fqdn);
  }

  addToMonitoring(): void {
    const toAdd = Array.from(this.selectedMonitoring());
    if (!toAdd.length) {
      this.notify('Select DNS to add', 'err');
      return;
    }

    const current = this.monitoringDnsList();
    const newEntries: DnsEntry[] = [];

    for (const fqdn of toAdd) {
      const pool = this.MONITORING_POOL.find((p) => p.fqdn === fqdn);
      if (pool && !current.some((d) => d.fqdn === fqdn)) {
        const entry: DnsEntry = { fqdn: pool.fqdn, zone: pool.zone, services: [], isLoading: false, lastUpdated: null, isExpanded: true };
        newEntries.push(entry);
      }
    }

    this.monitoringDnsList.update((l) => [...l, ...newEntries]);
    this.selectedMonitoring.set(new Set());

    // Fetch status
    newEntries.forEach((d) => this.fetchStatus(d.fqdn, d.zone, 'monitor'));
    this.notify(`Added ${newEntries.length} DNS`, 'ok');
  }

  removeFromMonitoring(fqdn: string): void {
    this.monitoringDnsList.update((l) => l.filter((d) => d.fqdn !== fqdn));
  }

  // ============================================================================
  // DNS STATUS
  // ============================================================================

  async fetchStatus(fqdn: string, zone: DnsZone, listType: 'task' | 'monitor'): Promise<void> {
    this.updateDns(fqdn, zone, { isLoading: true }, listType);
    try {
      const h = new HttpHeaders({
        Authorization: `Bearer ${this.token()}`,
        'Content-Type': 'application/json',
        'X-USER': this.username(),
      });
      const type = zone === 'internal' ? 'internal' : 'eksternal';
      const res = await firstValueFrom(
        this.http.post<{ data: Service[] }>(`${this.baseUrl()}/fqdn/detail?type=${type}`, { fqdn, position: 'current' }, { headers: h })
      );
      this.updateDns(fqdn, zone, { services: res.data || [], isLoading: false, lastUpdated: new Date() }, listType);
    } catch {
      this.updateDns(fqdn, zone, { isLoading: false }, listType);
    }
  }

  refreshTaskDns(): void {
    this.taskDnsList().forEach((d) => this.fetchStatus(d.fqdn, d.zone, 'task'));
  }

  refreshMonitorDns(): void {
    this.monitoringDnsList().forEach((d) => this.fetchStatus(d.fqdn, d.zone, 'monitor'));
  }

  toggleExpand(fqdn: string, zone: DnsZone, listType: 'task' | 'monitor'): void {
    const list = listType === 'task' ? this.taskDnsList() : this.monitoringDnsList();
    const entry = list.find((d) => d.fqdn === fqdn && d.zone === zone);
    if (entry) {
      this.updateDns(fqdn, zone, { isExpanded: !entry.isExpanded }, listType);
    }
  }

  private updateDns(fqdn: string, zone: DnsZone, u: Partial<DnsEntry>, listType: 'task' | 'monitor'): void {
    if (listType === 'task') {
      this.taskDnsList.update((l) => l.map((d) => (d.fqdn === fqdn && d.zone === zone ? { ...d, ...u } : d)));
    } else {
      this.monitoringDnsList.update((l) => l.map((d) => (d.fqdn === fqdn && d.zone === zone ? { ...d, ...u } : d)));
    }
  }

  // ============================================================================
  // SERVICE SELECTION (Task DNS only)
  // ============================================================================

  toggleSvc(name: string): void {
    const s = new Set(this.selectedSvc());
    s.has(name) ? s.delete(name) : s.add(name);
    this.selectedSvc.set(s);
  }

  isSvcSelected(name: string): boolean {
    return this.selectedSvc().has(name);
  }

  clearSvcSel(): void {
    this.selectedSvc.set(new Set());
  }

  // ============================================================================
  // SUSPEND / UNSUSPEND (Task DNS only)
  // ============================================================================

  /**
   * Internal helper - suspend a single service without triggering refresh/loading
   * Returns true if successful, false if failed
   */
  private async suspendSingle(svc: Service, fqdn: string, zone: DnsZone): Promise<boolean> {
    try {
      const h = new HttpHeaders({
        Authorization: `Bearer ${this.token()}`,
        'Content-Type': 'application/json',
        'X-USER': this.username(),
      });
      const body = {
        SVC_NAME: svc.svc_name,
        SVC_STATE: svc.state,
        PORT: +svc.svr_port,
        VS_NAME: svc.vs_name || '',
        FQDN: fqdn,
        IP: svc.svr_ip,
        ID: svc.id || 0,
      };
      await firstValueFrom(
        this.http.post(`${this.baseUrl()}/fun/suspend?type=${zone === 'internal' ? 'internal' : 'eksternal'}`, body, { headers: h })
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Internal helper - unsuspend a single service without triggering refresh/loading
   * Returns true if successful, false if failed
   */
  private async unsuspendSingle(svc: Service, fqdn: string, zone: DnsZone): Promise<boolean> {
    try {
      const h = new HttpHeaders({
        Authorization: `Bearer ${this.token()}`,
        'Content-Type': 'application/json',
        'X-USER': this.username(),
      });
      const body = {
        SVC_NAME: svc.svc_name,
        SVC_STATE: svc.state,
        PORT: +svc.svr_port,
        VS_NAME: svc.vs_name || '',
        FQDN: fqdn,
        IP: svc.svr_ip,
        ID: svc.id || 0,
      };
      await firstValueFrom(
        this.http.post(`${this.baseUrl()}/fun/unsuspend?type=${zone === 'internal' ? 'internal' : 'eksternal'}`, body, { headers: h })
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Suspend a single service (UI button action)
   */
  async suspend(svc: Service, fqdn: string, zone: DnsZone): Promise<void> {
    this.loading.set(true);
    try {
      const success = await this.suspendSingle(svc, fqdn, zone);
      if (success) {
        this.notify('Suspended', 'ok');
        await this.fetchStatus(fqdn, zone, 'task');
      } else {
        this.notify('Suspend failed', 'err');
      }
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Unsuspend a single service (UI button action)
   */
  async unsuspend(svc: Service, fqdn: string, zone: DnsZone): Promise<void> {
    this.loading.set(true);
    try {
      const success = await this.unsuspendSingle(svc, fqdn, zone);
      if (success) {
        this.notify('Unsuspended', 'ok');
        await this.fetchStatus(fqdn, zone, 'task');
      } else {
        this.notify('Unsuspend failed', 'err');
      }
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Suspend ALL services under a DNS entry (parallel execution)
   */
  async suspendDns(fqdn: string, zone: DnsZone): Promise<void> {
    const d = this.taskDnsList().find((x) => x.fqdn === fqdn && x.zone === zone);
    if (!d || !d.services.length) {
      this.notify('No services to suspend', 'info');
      return;
    }

    this.loading.set(true);
    try {
      // Execute all suspend calls in parallel
      const results = await Promise.all(
        d.services.map((s) => this.suspendSingle(s, fqdn, zone))
      );

      const successCount = results.filter((r) => r).length;
      const failCount = results.length - successCount;

      if (failCount > 0) {
        this.notify(`Suspended ${successCount}/${results.length} services`, 'info');
      } else {
        this.notify(`Suspended all ${successCount} services`, 'ok');
      }

      // Single refresh after all operations complete
      await this.fetchStatus(fqdn, zone, 'task');
    } catch {
      this.notify('Suspend DNS failed', 'err');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Unsuspend ALL services under a DNS entry (parallel execution)
   */
  async unsuspendDns(fqdn: string, zone: DnsZone): Promise<void> {
    const d = this.taskDnsList().find((x) => x.fqdn === fqdn && x.zone === zone);
    if (!d || !d.services.length) {
      this.notify('No services to unsuspend', 'info');
      return;
    }

    this.loading.set(true);
    try {
      // Execute all unsuspend calls in parallel
      const results = await Promise.all(
        d.services.map((s) => this.unsuspendSingle(s, fqdn, zone))
      );

      const successCount = results.filter((r) => r).length;
      const failCount = results.length - successCount;

      if (failCount > 0) {
        this.notify(`Unsuspended ${successCount}/${results.length} services`, 'info');
      } else {
        this.notify(`Unsuspended all ${successCount} services`, 'ok');
      }

      // Single refresh after all operations complete
      await this.fetchStatus(fqdn, zone, 'task');
    } catch {
      this.notify('Unsuspend DNS failed', 'err');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Bulk suspend selected services across multiple DNS entries (parallel execution)
   */
  async bulkSuspend(): Promise<void> {
    const selected = Array.from(this.selectedSvc());
    if (!selected.length) {
      this.notify('No services selected', 'info');
      return;
    }

    this.loading.set(true);
    try {
      // Group services by DNS entry for efficient refresh
      const byDns = new Map<string, { dns: DnsEntry; services: Service[] }>();

      for (const name of selected) {
        const dns = this.taskDnsList().find((d) => d.services.some((s) => s.svc_name === name));
        const svc = dns?.services.find((s) => s.svc_name === name);
        if (dns && svc) {
          const key = `${dns.fqdn}|${dns.zone}`;
          if (!byDns.has(key)) {
            byDns.set(key, { dns, services: [] });
          }
          byDns.get(key)!.services.push(svc);
        }
      }

      // Execute all suspend calls in parallel
      const allPromises: Promise<boolean>[] = [];
      for (const { dns, services } of byDns.values()) {
        for (const svc of services) {
          allPromises.push(this.suspendSingle(svc, dns.fqdn, dns.zone));
        }
      }

      const results = await Promise.all(allPromises);
      const successCount = results.filter((r) => r).length;
      const failCount = results.length - successCount;

      if (failCount > 0) {
        this.notify(`Suspended ${successCount}/${results.length} services`, 'info');
      } else {
        this.notify(`Suspended ${successCount} services`, 'ok');
      }

      // Refresh only affected DNS entries (once each, in parallel)
      await Promise.all(
        Array.from(byDns.values()).map(({ dns }) => this.fetchStatus(dns.fqdn, dns.zone, 'task'))
      );
    } catch {
      this.notify('Bulk suspend failed', 'err');
    } finally {
      this.loading.set(false);
      this.clearSvcSel();
    }
  }

  /**
   * Bulk unsuspend selected services across multiple DNS entries (parallel execution)
   */
  async bulkUnsuspend(): Promise<void> {
    const selected = Array.from(this.selectedSvc());
    if (!selected.length) {
      this.notify('No services selected', 'info');
      return;
    }

    this.loading.set(true);
    try {
      // Group services by DNS entry for efficient refresh
      const byDns = new Map<string, { dns: DnsEntry; services: Service[] }>();

      for (const name of selected) {
        const dns = this.taskDnsList().find((d) => d.services.some((s) => s.svc_name === name));
        const svc = dns?.services.find((s) => s.svc_name === name);
        if (dns && svc) {
          const key = `${dns.fqdn}|${dns.zone}`;
          if (!byDns.has(key)) {
            byDns.set(key, { dns, services: [] });
          }
          byDns.get(key)!.services.push(svc);
        }
      }

      // Execute all unsuspend calls in parallel
      const allPromises: Promise<boolean>[] = [];
      for (const { dns, services } of byDns.values()) {
        for (const svc of services) {
          allPromises.push(this.unsuspendSingle(svc, dns.fqdn, dns.zone));
        }
      }

      const results = await Promise.all(allPromises);
      const successCount = results.filter((r) => r).length;
      const failCount = results.length - successCount;

      if (failCount > 0) {
        this.notify(`Unsuspended ${successCount}/${results.length} services`, 'info');
      } else {
        this.notify(`Unsuspended ${successCount} services`, 'ok');
      }

      // Refresh only affected DNS entries (once each, in parallel)
      await Promise.all(
        Array.from(byDns.values()).map(({ dns }) => this.fetchStatus(dns.fqdn, dns.zone, 'task'))
      );
    } catch {
      this.notify('Bulk unsuspend failed', 'err');
    } finally {
      this.loading.set(false);
      this.clearSvcSel();
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  stateClass(s: string): string {
    return s === 'UP' ? 'up' : s === 'DOWN' ? 'down' : 'oos';
  }

  countState(d: DnsEntry, s: string): number {
    return d.services.filter((x) => x.state === s).length;
  }

  notify(msg: string, type: 'ok' | 'err' | 'info'): void {
    const id = ++this.toastCounter;
    this.toasts.update((t) => [...t, { id, msg, type }]);
    setTimeout(() => this.toasts.update((t) => t.filter((x) => x.id !== id)), 3500);
  }

  dismissToast(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
}
