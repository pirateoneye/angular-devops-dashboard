import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import {
  ToolCatalogService,
  ToolEntry,
} from '../../core/service/tool-catalog.service';

interface ToolTile {
  label: string;
  description: string;
  icon: string;
  route: string;
  group: 'tools-dev' | 'utility' | 'piket';
  queryParams?: { t: string };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    FormsModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  query = signal('');

  tiles: ToolTile[] = [
    {
      label: 'Batch Runner',
      description: 'Jalankan batch manual di UAT',
      icon: 'event_note',
      route: '/tools-dev/batch-runner',
      group: 'tools-dev',
    },
    {
      label: 'Crypto',
      description: 'Enkripsi / dekripsi / decode',
      icon: 'enhanced_encryption',
      route: '/tools-dev/crypto',
      group: 'tools-dev',
    },
    {
      label: 'Check Data',
      description: 'Cek data pengajuan',
      icon: 'search',
      route: '/tools-dev/check-data',
      group: 'tools-dev',
    },
    {
      label: 'Delete Data',
      description: 'Hapus data pengajuan',
      icon: 'delete',
      route: '/tools-dev/delete-data',
      group: 'tools-dev',
    },
    {
      label: 'File Server Manager',
      description: 'Kelola file server',
      icon: 'folder',
      route: '/tools-dev/file-server-manager',
      group: 'tools-dev',
    },
    {
      label: 'Push Notif FCM',
      description: 'Kirim push notification FCM',
      icon: 'notifications',
      route: '/tools-dev/push-notif-fcm',
      group: 'tools-dev',
    },
    {
      label: 'Publish Kafka',
      description: 'Publish message ke Kafka',
      icon: 'send',
      route: '/tools-dev/publish-kafka',
      group: 'tools-dev',
    },
    {
      label: 'GitLab Tools',
      description: 'Monitor tag & operasi bulk GitLab',
      icon: 'merge_type',
      route: '/tools-dev/gitlab',
      group: 'tools-dev',
    },
    {
      label: 'GSLB',
      description: 'Monitor & suspend/unsuspend GSLB DNS',
      icon: 'dns',
      route: '/tools-dev/gslb',
      group: 'tools-dev',
    },
    {
      label: 'MSV Test',
      description: 'Sandbox komponen MSV',
      icon: 'science',
      route: '/tools-dev/msv-test',
      group: 'tools-dev',
    },
    {
      label: 'MSV Docs',
      description: 'Dokumentasi komponen MSV',
      icon: 'menu_book',
      route: '/tools-dev/msv-docs',
      group: 'tools-dev',
    },
    {
      label: 'Utilities',
      description:
        '15 tools: JSON, decoder, regex, hash, JWT, SSL, diff, transforms, sort, char counter, cron, image/base64, timestamp, chmod, random',
      icon: 'build',
      route: '/utilities',
      group: 'utility',
    },
    {
      label: 'List Keluhan',
      description: 'Daftar keluhan piket',
      icon: 'list_alt',
      route: '/piket/keluhan-list',
      group: 'piket',
    },
    {
      label: 'Fix Data User',
      description: 'Perbaiki data user',
      icon: 'edit',
      route: '/piket/fix-data-user',
      group: 'piket',
    },
    {
      label: 'Fix After Merge CIS',
      description: 'Perbaikan pasca merge CIS',
      icon: 'merge_type',
      route: '/piket/fix-after-merge-cis',
      group: 'piket',
    },
    {
      label: 'Calendar Piket',
      description: 'Jadwal piket',
      icon: 'calendar_today',
      route: '/piket/calendar',
      group: 'piket',
    },
  ];

  groups: { key: ToolTile['group']; label: string }[] = [
    { key: 'tools-dev', label: 'Dev Tools' },
    { key: 'utility', label: 'Utilities' },
    { key: 'piket', label: 'Piket' },
  ];

  readonly toolStats = computed(() => ({
    devTools: this.tiles.filter((t) => t.group === 'tools-dev').length,
    utilities: this.tiles.filter((t) => t.group === 'utility').length,
    piket: this.tiles.filter((t) => t.group === 'piket').length,
  }));

  constructor(
    public catalog: ToolCatalogService,
    private hostRef: ElementRef<HTMLElement>,
  ) {}

  get hasQuery(): boolean {
    return this.query().trim().length > 0;
  }

  readonly showClear = computed(() => this.hasQuery);

  clearQuery(): void {
    this.query.set('');
  }

  @HostListener('window:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing =
      (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) ||
      !!target?.isContentEditable;
    if (event.key === '/' && !typing) {
      event.preventDefault();
      this.hostRef.nativeElement
        .querySelector<HTMLInputElement>('.dash-hero-search input')
        ?.focus();
    }
  }

  /** Recently used tools, resolved from the catalog. Memoized until recents change. */
  readonly recentTools = computed<ToolEntry[]>(() =>
    this.catalog
      .recents()
      .map((s) => this.catalog.bySlug(s))
      .filter((t): t is ToolEntry => !!t),
  );

  /**
   * Tiles grouped by group key, filtered by the current query. Memoized until
   * the `query` signal changes, so the template no longer pays O(groups x tiles)
   * on every change-detection pass.
   */
  readonly tilesByGroup = computed<Record<string, ToolTile[]>>(() => {
    const q = this.query().trim().toLowerCase();
    const map: Record<string, ToolTile[]> = {};
    for (const g of this.groups) {
      map[g.key] = this.tiles.filter((t) => {
        if (t.group !== g.key) return false;
        if (!q) return true;
        return (
          t.label.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.route.toLowerCase().includes(q)
        );
      });
    }
    return map;
  });

  /** Lookup helper for templates; reads from the memoized `tilesByGroup` map. */
  tilesFor(key: string): ToolTile[] {
    return this.tilesByGroup()[key] ?? [];
  }

  /** Total matching tiles across all groups. */
  readonly totalResults = computed(() =>
    this.groups.reduce((sum, g) => sum + this.tilesByGroup()[g.key].length, 0),
  );

  /** True when a search is active but matched no tiles in any group. */
  readonly noResults = computed<boolean>(
    () =>
      this.hasQuery &&
      !this.groups.some((g) => this.tilesByGroup()[g.key].length > 0),
  );

  hasGroup(key: string): boolean {
    return this.tiles.some((t) => t.group === key);
  }
}
