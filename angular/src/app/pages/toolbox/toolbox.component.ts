import {
  Component,
  ChangeDetectionStrategy,
  computed,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnInit,
  signal,
  DestroyRef,
  Type,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  ToolCatalogService,
  ToolEntry,
  ToolGroup,
} from '../../core/service/tool-catalog.service';

/**
 * Slug -> dynamic-import map. Each utility tool is loaded on demand so the
 * /utilities initial chunk only contains the toolbox shell, not all 30 tools
 * (and their heavy deps such as jsrsasign / crypto-js).
 *
 * This record is the single source of truth for the set of tool slugs the
 * toolbox can render; `ToolSlug` is derived from its keys so the union can
 * never drift from the loaders (and therefore the template's ngComponentOutlet
 * can never render a blank panel for a catalog entry that has no loader).
 */
const TOOL_LOADERS = {
  'json-formatter': () =>
    import('../tools-dev/json-formatter/json-formatter.component').then(
      (m) => m.JsonFormatterComponent,
    ),
  decoder: () =>
    import('../tools-dev/decoder/decoder.component').then(
      (m) => m.DecoderComponent,
    ),
  'regex-tester': () =>
    import('../tools-dev/regex-tester/regex-tester.component').then(
      (m) => m.RegexTesterComponent,
    ),
  'id-generator': () =>
    import('../tools-dev/id-generator/id-generator.component').then(
      (m) => m.IdGeneratorComponent,
    ),
  'hash-generator': () =>
    import('../tools-dev/hash-generator/hash-generator.component').then(
      (m) => m.HashGeneratorComponent,
    ),
  'password-generator': () =>
    import('../tools-dev/password-generator/password-generator.component').then(
      (m) => m.PasswordGeneratorComponent,
    ),
  'text-diff': () =>
    import('../tools-dev/text-diff/text-diff.component').then(
      (m) => m.TextDiffComponent,
    ),
  'color-converter': () =>
    import('../tools-dev/color-converter/color-converter.component').then(
      (m) => m.ColorConverterComponent,
    ),
  'text-transforms': () =>
    import('../tools-dev/text-transforms/text-transforms.component').then(
      (m) => m.TextTransformsComponent,
    ),
  'base-converter': () =>
    import('../tools-dev/base-converter/base-converter.component').then(
      (m) => m.BaseConverterComponent,
    ),
  'http-status': () =>
    import('../tools-dev/http-status/http-status.component').then(
      (m) => m.HttpStatusComponent,
    ),
  'unicode-escape': () =>
    import('../tools-dev/unicode-escape/unicode-escape.component').then(
      (m) => m.UnicodeEscapeComponent,
    ),
  markdown: () =>
    import('../tools-dev/markdown/markdown.component').then(
      (m) => m.MarkdownComponent,
    ),
  'cron-explainer': () =>
    import('../tools-dev/cron-explainer/cron-explainer.component').then(
      (m) => m.CronExplainerComponent,
    ),
  'image-base64': () =>
    import('../tools-dev/image-base64/image-base64.component').then(
      (m) => m.ImageBase64Component,
    ),
  'lorem-ipsum': () =>
    import('../tools-dev/lorem-ipsum/lorem-ipsum.component').then(
      (m) => m.LoremIpsumComponent,
    ),
  'timestamp-converter': () =>
    import('../tools-dev/timestamp-converter/timestamp-converter.component').then(
      (m) => m.TimestampConverterComponent,
    ),
  'csv-json': () =>
    import('../tools-dev/csv-json/csv-json.component').then(
      (m) => m.CsvJsonComponent,
    ),
  'sql-formatter': () =>
    import('../tools-dev/sql-formatter/sql-formatter.component').then(
      (m) => m.SqlFormatterComponent,
    ),
  'text-sort': () =>
    import('../tools-dev/text-sort/text-sort.component').then(
      (m) => m.TextSortComponent,
    ),
  'char-counter': () =>
    import('../tools-dev/char-counter/char-counter.component').then(
      (m) => m.CharCounterComponent,
    ),
  'slug-generator': () =>
    import('../tools-dev/slug-generator/slug-generator.component').then(
      (m) => m.SlugGeneratorComponent,
    ),
  'url-parser': () =>
    import('../tools-dev/url-parser/url-parser.component').then(
      (m) => m.UrlParserComponent,
    ),
  'chmod-calc': () =>
    import('../tools-dev/chmod-calc/chmod-calc.component').then(
      (m) => m.ChmodCalcComponent,
    ),
  'line-tools': () =>
    import('../tools-dev/line-tools/line-tools.component').then(
      (m) => m.LineToolsComponent,
    ),
  'random-picker': () =>
    import('../tools-dev/random-picker/random-picker.component').then(
      (m) => m.RandomPickerComponent,
    ),
  'word-frequency': () =>
    import('../tools-dev/word-frequency/word-frequency.component').then(
      (m) => m.WordFrequencyComponent,
    ),
  'hmac-signer': () =>
    import('../tools-dev/hmac-signer/hmac-signer.component').then(
      (m) => m.HmacSignerComponent,
    ),
  'jwt-debugger': () =>
    import('../tools-dev/jwt-debugger/jwt-debugger.component').then(
      (m) => m.JwtDebuggerComponent,
    ),
  'ssl-converter': () =>
    import('../tools-dev/ssl-converter/ssl-converter.component').then(
      (m) => m.SslConverterComponent,
    ),
} satisfies Record<string, () => Promise<Type<unknown>>>;

export type ToolSlug = keyof typeof TOOL_LOADERS;

interface GroupEntry {
  group: ToolGroup;
  tools: ToolEntry[];
}

@Component({
  selector: 'app-toolbox',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, FormsModule],
  templateUrl: './toolbox.component.html',
  styleUrls: ['./toolbox.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolboxComponent implements OnInit {
  /** Default tab when used as an embedded component (no query param). */
  @Input() initialTab: ToolSlug = 'json-formatter';

  /** Currently selected tool slug. */
  readonly active = signal<ToolSlug>('json-formatter');
  /** Search/filter query. */
  readonly query = signal('');
  /** Lazily-loaded component class for the active tool (null while loading). */
  readonly toolCmp = signal<Type<unknown> | null>(null);
  /** Mobile-only: whether the tab list is expanded. Closed by default so the
   *  selected tool renders right under the header instead of below 700px of
   *  wrapping tool chips. */
  readonly mobileTabsOpen = signal(false);
  /** Display label of the active tool, for the mobile tab bar. */
  readonly activeLabel = computed(
    () => this.catalog.bySlug(this.active())?.label ?? this.active(),
  );

  /** Pinned favorites, filtered by the current query. */
  readonly favoriteTools = computed<ToolEntry[]>(() =>
    this.catalog
      .favorites()
      .map((s) => this.catalog.bySlug(s))
      .filter((t): t is ToolEntry => !!t)
      .filter((t) => this.matchesQuery(t)),
  );

  /** Recently used tools, filtered by the current query. */
  readonly recentTools = computed<ToolEntry[]>(() =>
    this.catalog
      .recents()
      .map((s) => this.catalog.bySlug(s))
      .filter((t): t is ToolEntry => !!t)
      .filter((t) => this.matchesQuery(t)),
  );

  /** Category groups with their filtered tool lists (memoized per query). */
  readonly groupEntries = computed<GroupEntry[]>(() =>
    this.catalog.groups.map((g) => ({
      group: g,
      tools: this.catalog.toolsInGroup(g, this.query()),
    })),
  );

  readonly hasQuery = computed<boolean>(() => this.query().trim().length > 0);

  /** Whether any tool (pinned or grouped) is visible under the current filter. */
  readonly hasAnyTool = computed<boolean>(
    () =>
      this.favoriteTools().length > 0 ||
      this.recentTools().length > 0 ||
      this.groupEntries().some((ge) => ge.tools.length > 0),
  );

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public catalog: ToolCatalogService,
    private hostRef: ElementRef<HTMLElement>,
  ) {}

  ngOnInit(): void {
    // Seed the active tool from the @Input, then from the query param if present.
    let initial: ToolSlug = this.initialTab;
    const fromUrl = this.route.snapshot.queryParamMap.get(
      't',
    ) as ToolSlug | null;
    if (fromUrl && this.catalog.bySlug(fromUrl)) initial = fromUrl;
    this.active.set(initial);
    this.loadTool(initial);

    // Keep active in sync with the URL (browser back/forward, programmatic nav).
    // Only react to external changes; select() handles its own load to avoid
    // a duplicate fetch when the navigation it triggers echoes back here.
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((p) => {
        const t = p.get('t') as ToolSlug | null;
        if (t && t !== this.active() && this.catalog.bySlug(t)) {
          this.active.set(t);
          this.loadTool(t);
        }
      });
  }

  select(slug: string): void {
    const tool = slug as ToolSlug;
    this.active.set(tool);
    this.catalog.recordUse(slug);
    this.loadTool(tool);
    // Collapse the mobile tab list once a tool is chosen.
    this.mobileTabsOpen.set(false);
    // Only sync the URL when hosted on the /utilities route; embedded usage stays in-memory.
    if (this.router.url.startsWith('/utilities')) {
      this.router.navigate(['/utilities'], {
        queryParams: { t: slug },
        queryParamsHandling: 'merge',
      });
    }
  }

  toggleMobileTabs(): void {
    this.mobileTabsOpen.update((v) => !v);
  }

  isFav(slug: string): boolean {
    return this.catalog.isFavorite(slug);
  }

  toggleFav(event: Event, slug: string): void {
    event.stopPropagation();
    event.preventDefault();
    this.catalog.toggleFavorite(slug);
  }

  /** Focus the search box with `/` (GitHub-style); Esc clears it. */
  @HostListener('window:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing =
      (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) ||
      !!target?.isContentEditable;
    if (event.key === '/' && !typing) {
      event.preventDefault();
      this.hostRef.nativeElement
        .querySelector<HTMLInputElement>('.toolbox-search-input')
        ?.focus();
    } else if (
      event.key === 'Escape' &&
      target?.classList.contains('toolbox-search-input')
    ) {
      this.query.set('');
      (target as HTMLInputElement).blur();
    }
  }

  private async loadTool(slug: string): Promise<void> {
    const factory = (
      TOOL_LOADERS as Record<string, () => Promise<Type<unknown>>>
    )[slug];
    if (!factory) return;
    const cmp = await factory();
    // Guard against a stale load completing after the user switched tools.
    if (this.active() !== slug) return;
    this.toolCmp.set(cmp);
  }

  private matchesQuery(t: ToolEntry): boolean {
    const q = this.query().trim().toLowerCase();
    if (!q) return true;
    return (
      t.label.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.group.toLowerCase().includes(q) ||
      (t.keywords ?? []).some((k) => k.includes(q))
    );
  }
}
