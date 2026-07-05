import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  HostListener,
  Inject,
  OnInit,
  signal,
  computed,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ToolCatalogService,
  ToolEntry,
  NavEntry,
} from '../../../core/service/tool-catalog.service';

interface ResultRow {
  kind: 'tool' | 'nav';
  label: string;
  icon: string;
  group: string;
  route: string;
  queryParams?: { t: string };
  /** True for favorite tool rows shown at the top when there is no query. */
  favorite?: boolean;
}

/**
 * Ctrl+K command palette. Searches the 30 toolbox utilities + the standalone
 * dev-tool pages + piket routes, keyboard-navigable. Selecting a row navigates
 * and closes the dialog.
 */
@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent implements OnInit {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  readonly query = signal('');
  readonly activeIndex = signal(0);
  /** Derived from `query` so there is no second signal to keep in sync. */
  readonly results = computed<ResultRow[]>(() => this.buildRows(this.query()));

  constructor(
    private readonly catalog: ToolCatalogService,
    private readonly router: Router,
    private readonly ref: MatDialogRef<CommandPaletteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { favorites: string[] },
  ) {
    // Reset the active row whenever the query changes (including the first set).
    effect(
      () => {
        this.query();
        this.activeIndex.set(0);
      },
      { allowSignalWrites: true },
    );
  }

  close(): void {
    this.ref.close();
  }

  ngOnInit(): void {
    // Defer focus to the next tick so the input is rendered.
    Promise.resolve().then(() => this.searchInput?.nativeElement.focus());
  }

  /** Build the result rows for the current query. Favorites first when empty. */
  private buildRows(query: string): ResultRow[] {
    const q = query.trim();
    const rows: ResultRow[] = [];

    const toolRow = (tool: ToolEntry, favorite = false): ResultRow => ({
      kind: 'tool',
      label: tool.label,
      icon: tool.icon,
      group: tool.group,
      route: tool.route,
      queryParams: tool.queryParams,
      favorite,
    });

    if (!q) {
      const favs = this.data.favorites
        .map((s) => this.catalog.bySlug(s))
        .filter((t): t is ToolEntry => !!t)
        .map((t) => toolRow(t, true));
      rows.push(...favs);

      for (const tool of this.catalog.tools) {
        if (!this.data.favorites.includes(tool.slug)) rows.push(toolRow(tool));
      }
      for (const n of [...this.catalog.devTools, ...this.catalog.piket])
        rows.push(this.navRow(n));
    } else {
      rows.push(...this.catalog.searchTools(q).map((t) => toolRow(t)));
      rows.push(...this.catalog.searchNav(q).map((n) => this.navRow(n)));
    }

    return rows;
  }

  private navRow(n: NavEntry): ResultRow {
    return {
      kind: 'nav',
      label: n.label,
      icon: n.icon,
      group: n.group,
      route: n.route,
    };
  }

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    const rows = this.results();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = Math.min(this.activeIndex() + 1, rows.length - 1);
      this.activeIndex.set(next);
      this.scrollToActive(next);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = Math.max(this.activeIndex() - 1, 0);
      this.activeIndex.set(prev);
      this.scrollToActive(prev);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const row = rows[this.activeIndex()];
      if (row) this.choose(row);
    } else if (event.key === 'Escape') {
      this.ref.close();
    }
  }

  choose(row: ResultRow): void {
    if (row.kind === 'tool' && row.queryParams) {
      this.router.navigate([row.route], { queryParams: row.queryParams });
    } else {
      this.router.navigate([row.route]);
    }
    this.ref.close();
  }

  private scrollToActive(index: number): void {
    const el = document.getElementById('pal-opt-' + index);
    el?.scrollIntoView({ block: 'nearest' });
  }
}
