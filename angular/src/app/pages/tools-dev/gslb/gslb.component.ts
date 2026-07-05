import {
  Component,
  inject,
  OnDestroy,
  ChangeDetectionStrategy,
  HostListener,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../module/material.module';
import { GslbService } from '../../../shared/service/gslb/gslb.service';
import {
  GslbCard,
  GslbMember,
  GslbState,
  GslbZone,
} from '../../../shared/service/gslb/gslb.models';

interface Toast {
  id: number;
  msg: string;
  type: 'ok' | 'err' | 'info';
}

@Component({
  standalone: true,
  selector: 'app-gslb',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './gslb.component.html',
  styleUrl: './gslb.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GslbComponent implements OnDestroy {
  readonly svc = inject(GslbService);
  private readonly router = inject(Router);

  // DNS picker (search the pool, choose which to show)
  dnsZone: GslbZone = 'external';

  // self-contained toasts
  readonly toasts: Toast[] = [];
  private toastId = 0;
  private readonly toastTimers = new Set<ReturnType<typeof setTimeout>>();

  // armed two-click auto-disarm
  private readonly armTimers = new Set<ReturnType<typeof setTimeout>>();

  // DNS drawer
  readonly showDnsDrawer = signal(false);

  // filters scroll state
  readonly filtersScrolled = signal(false);

  // copy-to-clipboard feedback
  readonly copiedId = signal('');
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  // GTM slide-over focus management
  readonly slideEl = viewChild<ElementRef>('slidePanel');

  constructor() {
    // Console is reached already-authed (gslbGuard enforces it). Load tasks on entry.
    if (this.svc.authed()) {
      this.svc
        .loadTasks()
        .catch((e) => this.toast(String(e?.message ?? e), 'err'));
      // Eagerly fetch detail for any persisted monitor cards so the tables render.
      this.refreshMonitoring();
    }
  }

  // ---- auth ----
  logout(): void {
    this.svc.logout();
    this.toast('Logged out', 'info');
    this.router.navigateByUrl('/gslb/login');
  }

  reloadTasks(): void {
    this.svc
      .loadTasks()
      .catch((e) => this.toast(String(e?.message ?? e), 'err'));
    this.refreshMonitoring();
  }

  /** Fetch detail for every monitor card so the External/Internal tables render. */
  private refreshMonitoring(): void {
    this.svc
      .loadAllMonitoring()
      .catch((e) => this.toast(String(e?.message ?? e), 'err'));
  }

  // ---- DNS (view-only, pick which to show from a searchable pool) ----
  setDnsQuery(v: string): void {
    this.svc.setDnsQuery(v);
  }
  setDnsZone(z: GslbZone): void {
    this.dnsZone = z;
  }
  addDns(fqdn: string, zone: GslbZone): void {
    if (this.svc.addDns({ fqdn, zone })) {
      this.toast(`Showing ${fqdn}`, 'ok');
      this.refreshMonitoring();
    } else {
      this.toast('Already shown or empty', 'info');
    }
  }
  addDnsCustom(): void {
    const q = this.svc.dnsQuery().trim().toLowerCase();
    if (this.svc.addDnsCustom(q, this.dnsZone)) {
      this.toast(`Showing ${q}`, 'ok');
      this.refreshMonitoring();
    } else {
      this.toast('Already shown or empty', 'info');
    }
  }
  removeMonitoring(fqdn: string): void {
    this.svc.removeMonitoring(fqdn);
    this.toast('Removed from DNS', 'info');
  }
  clearMonitoring(): void {
    if (!this.svc.monCards().length) return;
    this.svc.clearMonitoring();
    this.toast('DNS cleared', 'info');
  }

  // ---- filters ----
  onSearch(v: string): void {
    this.svc.setSearch(v);
  }
  setZone(z: 'all' | 'internal' | 'external'): void {
    this.svc.setZoneFilter(z);
  }
  setSort(s: 'name' | 'updated'): void {
    this.svc.setSortKey(s);
  }
  clearFilters(): void {
    this.svc.clearFilters();
  }

  // ---- cards ----
  toggleExpand(fqdn: string): void {
    this.svc.toggleExpand(fqdn);
  }
  refresh(fqdn: string): void {
    this.svc
      .refresh(fqdn)
      .catch(() => this.toast('Refresh failed: ' + fqdn, 'err'));
  }

  // ---- two-click confirm for bulk suspend / unsuspend ----
  arm(card: GslbCard, action: 'suspend' | 'unsuspend'): void {
    this.svc.cards.update((list) =>
      list.map((c) => (c.fqdn === card.fqdn ? { ...c, armed: action } : c)),
    );
    const t = setTimeout(() => this.disarm(card.fqdn), 4500);
    this.armTimers.add(t);
  }
  disarm(fqdn: string): void {
    this.svc.cards.update((list) =>
      list.map((c) => (c.fqdn === fqdn ? { ...c, armed: null } : c)),
    );
  }
  confirmArm(card: GslbCard): void {
    const action = card.armed;
    this.disarm(card.fqdn);
    if (action === 'suspend') void this.suspendAll(card);
    else if (action === 'unsuspend') void this.unsuspendAll(card);
  }

  async suspendAll(card: GslbCard): Promise<void> {
    const r = await this.svc.suspendAll(card.fqdn);
    this.toast(
      r.fail ? `Suspended ${r.ok}/${r.ok + r.fail}` : `Suspended all ${r.ok}`,
      r.fail ? 'info' : 'ok',
    );
  }
  async unsuspendAll(card: GslbCard): Promise<void> {
    const r = await this.svc.unsuspendAll(card.fqdn);
    this.toast(
      r.fail
        ? `Unsuspended ${r.ok}/${r.ok + r.fail}`
        : `Unsuspended all ${r.ok}`,
      r.fail ? 'info' : 'ok',
    );
  }

  async suspend(member: GslbMember, fqdn: string): Promise<void> {
    const ok = await this.svc.suspend(member, fqdn);
    this.toast(ok ? 'Suspended' : 'Suspend failed', ok ? 'ok' : 'err');
  }
  async unsuspend(member: GslbMember, fqdn: string): Promise<void> {
    const ok = await this.svc.unsuspend(member, fqdn);
    this.toast(ok ? 'Unsuspended' : 'Unsuspend failed', ok ? 'ok' : 'err');
  }

  // ---- copy-to-clipboard ----
  copyText(text: unknown): void {
    const s = String(text ?? '');
    navigator.clipboard.writeText(s).then(
      () => {
        this.copiedId.set(s);
        if (this.copyTimer) clearTimeout(this.copyTimer);
        this.copyTimer = setTimeout(() => {
          this.copiedId.set('');
          this.copyTimer = null;
        }, 1500);
      },
      () => this.toast('Copy failed', 'err'),
    );
  }

  // ---- GTM slide-over ----
  gtmFqdn = '';
  openGtm(member: GslbMember, fqdn: string): void {
    this.gtmFqdn = fqdn;
    this.svc
      .openGtmDetail(member, fqdn)
      .catch(() => this.toast('GTM detail failed', 'err'));
    // Focus first focusable element in the modal
    setTimeout(() => {
      const el = this.slideEl()?.nativeElement;
      if (el) {
        const first: HTMLElement | null = el.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        first?.focus();
      }
    });
  }
  closeGtm(): void {
    this.svc.closeGtmDetail();
  }
  retryGtm(): void {
    const m = this.svc.gtmMember();
    if (m) this.openGtm(m, this.gtmFqdn);
  }

  // ---- helpers ----
  cardHasUp(c: GslbCard): boolean {
    return (c.snapshot?.members ?? []).some((m) => m.state === 'UP');
  }
  cardAllDown(c: GslbCard): boolean {
    const m = c.snapshot?.members ?? [];
    return m.length > 0 && m.every((m2) => m2.state === 'DOWN');
  }
  stateClass(s: GslbState): string {
    return s === 'UP'
      ? 'up'
      : s === 'DOWN'
        ? 'down'
        : s === 'SUSPENDED'
          ? 'susp'
          : 'oos';
  }
  stateLabel(s: GslbState): string {
    return s === 'UP'
      ? 'UP'
      : s === 'DOWN'
        ? 'DOWN'
        : s === 'SUSPENDED'
          ? 'SUSPENDED'
          : 'OUT OF SVC';
  }
  /** Compact 2-3 letter label for the small status buttons. */
  stateLabelShort(s: GslbState): string {
    return s === 'UP'
      ? 'UP'
      : s === 'DOWN'
        ? 'DN'
        : s === 'SUSPENDED'
          ? 'SUS'
          : 'OOS';
  }
  /** Tooltip for a member button: name · ip:port · state. */
  memberTitle(m: GslbMember): string {
    return `${this.shortName(m.svc_name)} · ${m.svr_ip}:${m.svr_port} · ${this.stateLabel(m.state)}`;
  }
  lastUpdated(card: GslbCard): string {
    if (!card.lastUpdated) return '';
    const d = new Date(card.lastUpdated);
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  shortName(svcName: string): string {
    return svcName.split(':').pop() ?? svcName;
  }
  trackFqdn(_: number, c: GslbCard): string {
    return c.fqdn;
  }
  trackMember(_: number, m: GslbMember): string {
    return m.svc_name;
  }

  totalMembers(): number {
    const c = this.svc.counts();
    return c.up + c.oos + c.down + c.susp;
  }

  toggleDnsDrawer(): void {
    this.showDnsDrawer.update((v) => !v);
  }

  // ---- scroll: filters scrolled style ----
  @HostListener('window:scroll')
  onScrollFilters(): void {
    this.filtersScrolled.set(window.scrollY > 100);
  }

  // ---- Esc: close GTM / disarm / DNS drawer ----
  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.svc.gtmMember()) {
      this.closeGtm();
      return;
    }
    if (this.showDnsDrawer()) {
      this.showDnsDrawer.set(false);
      return;
    }
    this.svc.cards.update((list) =>
      list.map((c) => (c.armed ? { ...c, armed: null } : c)),
    );
  }

  // ---- toasts ----
  toast(msg: string, type: 'ok' | 'err' | 'info'): void {
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
    this.armTimers.forEach((t) => clearTimeout(t));
    this.armTimers.clear();
    if (this.copyTimer) clearTimeout(this.copyTimer);
  }
}
