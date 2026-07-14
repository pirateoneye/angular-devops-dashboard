import {
  Component,
  inject,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService } from '../../../shared/service/activity.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../module/material.module';
import { ToastComponent } from '../../../shared/component/toast/toast.component';
import { CopyBtnComponent } from '../../../shared/component/copy-btn/copy-btn.component';
import { SkeletonComponent } from '../../../shared/component/skeleton/skeleton.component';
import { GslbService } from '../../../shared/service/gslb/gslb.service';
import {
  GslbCard,
  GslbMember,
  GslbState,
} from '../../../shared/service/gslb/gslb.models';


@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, ToastComponent, CopyBtnComponent, SkeletonComponent],
  templateUrl: './gslb.component.html',
  styleUrl: './gslb.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GslbComponent implements OnDestroy {
  readonly svc = inject(GslbService);
  private readonly router = inject(Router);
  private readonly feed = inject(ActivityService);

  readonly toasts: { id: number; msg: string; type: 'ok' | 'err' | 'info' }[] = [];
  private toastId = 0;
  readonly copiedId = signal('');
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  readonly visibleCards = computed(() => {
    let list = this.svc.cards();
    const zone = this.svc.zoneFilter();
    if (zone !== 'all') {
      list = list.filter((c) => c.zone === zone);
    }
    const search = this.svc.search().trim().toLowerCase();
    if (search) {
      list = list.filter((c) => c.fqdn.toLowerCase().includes(search));
    }
    const key = this.svc.sortKey();
    return [...list].sort((a, b) =>
      key === 'name'
        ? a.fqdn.localeCompare(b.fqdn)
        : (b.lastUpdated ?? 0) - (a.lastUpdated ?? 0),
    );
  });

  constructor() {
    if (this.svc.authed()) {
      this.refreshAll();
    }
  }

  logout(): void {
    this.svc.logout();
    this.toast('Logged out', 'info');
    this.router.navigateByUrl('/gslb/login');
  }

  reloadTasks(): void {
    this.svc.loadTasks().catch((e) => this.toast(String(e?.message ?? e), 'err'));
    this.refreshAll();
  }

  private refreshAll(): void {
    this.svc
      .loadAllMonitoring()
      .catch((e) => this.toast(String(e?.message ?? e), 'err'));
  }

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

  refresh(fqdn: string): void {
    this.svc
      .refresh(fqdn)
      .catch(() => this.toast('Refresh failed: ' + fqdn, 'err'));
  }
  // Two-click arm for bulk suspend/unsuspend
  armBulk(card: GslbCard, action: 'suspend' | 'unsuspend'): void {
    const armed = card.armed === action ? null : action;
    this.svc.setCardArmed(card.fqdn, armed);
    if (armed) {
      setTimeout(() => {
        const c = this.svc.cards().find((x) => x.fqdn === card.fqdn);
        if (c?.armed === action) this.svc.setCardArmed(card.fqdn, null);
      }, 5000);
    }
  }

  executeBulk(card: GslbCard): void {
    const action = card.armed;
    this.svc.setCardArmed(card.fqdn, null);
    if (action === 'suspend') this.suspendAll(card);
    else if (action === 'unsuspend') this.unsuspendAll(card);
  }

  async suspendAll(card: GslbCard): Promise<void> {
    const r = await this.svc.suspendAll(card.fqdn);
    const total = r.ok + r.fail;
    this.toast(r.fail ? `Suspended ${r.ok}/${total}` : `Suspended all ${r.ok}`, r.fail ? 'info' : 'ok');
    this.feed.log('gslb', `Suspend ${card.fqdn}: ${r.ok}/${total}`, r.fail ? 'warn' : 'ok');
  }
  async unsuspendAll(card: GslbCard): Promise<void> {
    const r = await this.svc.unsuspendAll(card.fqdn);
    const total = r.ok + r.fail;
    this.toast(r.fail ? `Unsuspended ${r.ok}/${total}` : `Unsuspended all ${r.ok}`, r.fail ? 'info' : 'ok');
    this.feed.log('gslb', `Unsuspend ${card.fqdn}: ${r.ok}/${total}`, r.fail ? 'warn' : 'ok');
  }

  async suspend(member: GslbMember, fqdn: string): Promise<void> {
    const ok = await this.svc.suspend(member, fqdn);
    this.toast(ok ? 'Suspended' : 'Suspend failed', ok ? 'ok' : 'err');
  }

  async unsuspend(member: GslbMember, fqdn: string): Promise<void> {
    const ok = await this.svc.unsuspend(member, fqdn);
    this.toast(ok ? 'Unsuspended' : 'Unsuspend failed', ok ? 'ok' : 'err');
  }

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

  cardHasUp(c: GslbCard): boolean {
    return (c.snapshot?.members ?? []).some((m) => m.state === 'UP');
  }

  cardAllDown(c: GslbCard): boolean {
    const m = c.snapshot?.members ?? [];
    return m.length > 0 && m.every((m2) => m2.state === 'DOWN');
  }

  stateClass(s: GslbState): string {
    return s === 'UP' ? 'up' : s === 'DOWN' ? 'down' : s === 'SUSPENDED' ? 'susp' : 'oos';
  }

  stateLabelShort(s: GslbState): string {
    return s === 'UP' ? 'UP' : s === 'DOWN' ? 'DOWN' : s === 'SUSPENDED' ? 'DITANGGUHKAN' : 'OOS';
  }

  lastUpdated(card: GslbCard): string {
    if (!card.lastUpdated) return '';
    const d = new Date(card.lastUpdated);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  shortName(svcName: string): string {
    return svcName.split(':').pop() ?? svcName;
  }

  totalMembers(): number {
    const c = this.svc.counts();
    return c.up + c.oos + c.down + c.susp;
  }

  trackFqdn(_: number, c: GslbCard): string {
    return c.fqdn;
  }

  trackMember(_: number, m: GslbMember): string {
    return m.svc_name;
  }


  toast(msg: string, type: 'ok' | 'err' | 'info'): void {
    const id = ++this.toastId;
    this.toasts.push({ id, msg, type });
    setTimeout(() => {
      const i = this.toasts.findIndex((x) => x.id === id);
      if (i >= 0) this.toasts.splice(i, 1);
    }, 3500);
  }

  dismissToast(id: number): void {
    const i = this.toasts.findIndex((x) => x.id === id);
    if (i >= 0) this.toasts.splice(i, 1);
  }

  ngOnDestroy(): void {
    clearTimeout(this.copyTimer ?? undefined);
  }
}
