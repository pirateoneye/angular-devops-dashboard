import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ToolCatalogService } from '../../core/service/tool-catalog.service';

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
  private readonly catalog = inject(ToolCatalogService);

  query = signal('');

  readonly devTiles = computed<ToolTile[]>(() =>
    this.catalog.devTools.map((d) => ({
      label: d.label,
      icon: d.icon,
      route: d.route,
      description: d.keywords?.slice(0, 2).join(', ') ?? '',
      group: 'tools-dev' as const,
    })),
  );

  readonly piketTiles = computed<ToolTile[]>(() =>
    this.catalog.piket.map((p) => ({
      label: p.label,
      icon: p.icon,
      route: p.route,
      description: '',
      group: 'piket' as const,
    })),
  );

  readonly allTiles = computed<ToolTile[]>(() => [
    ...this.devTiles(),
    ...this.piketTiles(),
    {
      label: 'Utilities',
      description: `${this.catalog.tools.length} tool bantu format & data`,
      icon: 'build',
      route: '/utilities',
      group: 'utility' as const,
    },
  ]);

  groups: { key: ToolTile['group']; label: string }[] = [
    { key: 'tools-dev', label: 'Dev Tools' },
    { key: 'utility', label: 'Utilities' },
    { key: 'piket', label: 'Piket' },
  ];

  readonly toolStats = computed(() => ({
    devTools: this.catalog.devTools.length,
    utilities: this.catalog.tools.length,
    piket: this.catalog.piket.length,
  }));

  /** Recently used utility tools as chips. */
  readonly recentTiles = computed(() =>
    this.catalog
      .recents()
      .map((slug) => this.catalog.bySlug(slug))
      .filter((t): t is NonNullable<typeof t> => !!t),
  );

  constructor(
    private hostRef: ElementRef<HTMLElement>,
  ) {}

  readonly hasQuery = computed(() => this.query().trim().length > 0);

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

  /**
   * Tiles grouped by group key, filtered by the current query. Memoized until
   * the `query` signal changes, so the template no longer pays O(groups x tiles)
   * on every change-detection pass.
   */
  readonly tilesByGroup = computed<Record<string, ToolTile[]>>(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.allTiles();
    const map: Record<string, ToolTile[]> = {};
    for (const g of this.groups) {
      map[g.key] = all.filter((t) => {
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
      this.hasQuery() &&
      !this.groups.some((g) => this.tilesByGroup()[g.key].length > 0),
  );

  hasGroup(key: string): boolean {
    return this.allTiles().some((t) => t.group === key);
  }
}
