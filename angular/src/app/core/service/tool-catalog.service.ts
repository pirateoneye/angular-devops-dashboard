import { Injectable, signal } from '@angular/core';

export type ToolGroup = 'Encoders & Crypto' | 'Text' | 'Format & Data';

export interface ToolEntry {
  slug: string;
  label: string;
  icon: string;
  group: ToolGroup;
  /** Words used by the search / command palette beyond label + slug. */
  keywords?: string[];
  /** Route to navigate to. Utility tools go to /utilities?t=slug. */
  route: string;
  /** Optional query params (used by utility tools). */
  queryParams?: { t: string };
}

export interface NavEntry {
  label: string;
  icon: string;
  route: string;
  keywords?: string[];
  group: 'Dev Tools' | 'Piket';
}

const FAV_KEY = 'msv-fav';
const RECENT_KEY = 'msv-recent';
const MAX_RECENT = 5;

/**
 * Single source of truth for the toolbox utilities + favorites/recents.
 * The toolbox sidebar, dashboard recents strip and command palette all read
 * from here so the list is defined in exactly one place.
 */
@Injectable({ providedIn: 'root' })
export class ToolCatalogService {
  /** The 15 toolbox utilities, grouped for the sidebar. */
  readonly tools: ToolEntry[] = [
    // Encoders & Crypto
    {
      slug: 'json-formatter',
      label: 'JSON',
      icon: 'data_object',
      group: 'Encoders & Crypto',
      route: '/utilities',
      queryParams: { t: 'json-formatter' },
      keywords: ['beautify', 'minify', 'validate'],
    },
    {
      slug: 'decoder',
      label: 'Decoder',
      icon: 'lock_open',
      group: 'Encoders & Crypto',
      route: '/utilities',
      queryParams: { t: 'decoder' },
      keywords: ['base64', 'url', 'hex'],
    },
    {
      slug: 'hash-generator',
      label: 'Hash',
      icon: 'tag',
      group: 'Encoders & Crypto',
      route: '/utilities',
      queryParams: { t: 'hash-generator' },
      keywords: ['md5', 'sha', 'sha256'],
    },
    {
      slug: 'jwt-debugger',
      label: 'JWT',
      icon: 'key',
      group: 'Encoders & Crypto',
      route: '/utilities',
      queryParams: { t: 'jwt-debugger' },
      keywords: ['token', 'json web token'],
    },
    {
      slug: 'ssl-converter',
      label: 'SSL',
      icon: 'https',
      group: 'Encoders & Crypto',
      route: '/utilities',
      queryParams: { t: 'ssl-converter' },
      keywords: ['pem', 'crt', 'certificate'],
    },
    // Text
    {
      slug: 'regex-tester',
      label: 'Regex',
      icon: 'rule',
      group: 'Text',
      route: '/utilities',
      queryParams: { t: 'regex-tester' },
      keywords: ['pattern', 'match'],
    },
    {
      slug: 'text-transforms',
      label: 'Transforms',
      icon: 'transform',
      group: 'Text',
      route: '/utilities',
      queryParams: { t: 'text-transforms' },
      keywords: ['case', 'upper', 'lower', 'camel'],
    },
    {
      slug: 'text-sort',
      label: 'Sort/Dedupe',
      icon: 'sort_by_alpha',
      group: 'Text',
      route: '/utilities',
      queryParams: { t: 'text-sort' },
      keywords: ['sort', 'dedupe', 'unique'],
    },
    {
      slug: 'char-counter',
      label: 'Counter',
      icon: 'text_fields',
      group: 'Text',
      route: '/utilities',
      queryParams: { t: 'char-counter' },
      keywords: ['count', 'characters', 'words'],
    },
    {
      slug: 'text-diff',
      label: 'Diff',
      icon: 'compare_arrows',
      group: 'Text',
      route: '/utilities',
      queryParams: { t: 'text-diff' },
      keywords: ['compare', 'difference'],
    },
    // Format & Data
    {
      slug: 'cron-explainer',
      label: 'Cron',
      icon: 'schedule',
      group: 'Format & Data',
      route: '/utilities',
      queryParams: { t: 'cron-explainer' },
      keywords: ['crontab', 'schedule'],
    },
    {
      slug: 'image-base64',
      label: 'Image/B64',
      icon: 'image',
      group: 'Format & Data',
      route: '/utilities',
      queryParams: { t: 'image-base64' },
      keywords: ['base64', 'encode'],
    },
    {
      slug: 'timestamp-converter',
      label: 'Timestamp',
      icon: 'access_time',
      group: 'Format & Data',
      route: '/utilities',
      queryParams: { t: 'timestamp-converter' },
      keywords: ['epoch', 'unix', 'date'],
    },
    {
      slug: 'chmod-calc',
      label: 'Chmod',
      icon: 'lock',
      group: 'Format & Data',
      route: '/utilities',
      queryParams: { t: 'chmod-calc' },
      keywords: ['permissions', 'unix', 'octal'],
    },
    {
      slug: 'random-picker',
      label: 'Random',
      icon: 'casino',
      group: 'Format & Data',
      route: '/utilities',
      queryParams: { t: 'random-picker' },
      keywords: ['pick', 'shuffle', 'lottery'],
    },
  ];

  /** Standalone dev-tool pages (not part of the 30-utility toolbox). */
  readonly devTools: NavEntry[] = [
    {
      label: 'Batch Runner',
      icon: 'event_note',
      route: '/tools-dev/batch-runner',
      group: 'Dev Tools',
      keywords: ['batch', 'uat'],
    },
    {
      label: 'Crypto',
      icon: 'enhanced_encryption',
      route: '/tools-dev/crypto',
      group: 'Dev Tools',
      keywords: ['encrypt', 'decrypt'],
    },
    {
      label: 'Check Data',
      icon: 'search',
      route: '/tools-dev/check-data',
      group: 'Dev Tools',
    },
    {
      label: 'Delete Data',
      icon: 'delete',
      route: '/tools-dev/delete-data',
      group: 'Dev Tools',
    },
    {
      label: 'File Server Manager',
      icon: 'folder',
      route: '/tools-dev/file-server-manager',
      group: 'Dev Tools',
    },
    {
      label: 'Push Notif FCM',
      icon: 'notifications',
      route: '/tools-dev/push-notif-fcm',
      group: 'Dev Tools',
      keywords: ['firebase', 'push'],
    },
    {
      label: 'Publish Kafka',
      icon: 'send',
      route: '/tools-dev/publish-kafka',
      group: 'Dev Tools',
      keywords: ['message', 'topic'],
    },
    {
      label: 'GitLab Tools',
      icon: 'merge_type',
      route: '/tools-dev/gitlab',
      group: 'Dev Tools',
      keywords: [
        'gitlab',
        'tag',
        'tags',
        'bulk',
        'mr',
        'merge',
        'branch',
        'release',
        'pipeline',
        'label',
      ],
    },
    {
      label: 'Jenkins Build',
      icon: 'build_circle',
      route: '/tools-dev/jenkins-build',
      group: 'Dev Tools',
      keywords: ['jenkins', 'ci', 'deploy', 'release', 'pipeline', 'job', 'build', 'batch', 'preset', 'generate'],
    },
    {
      label: 'SSL Check',
      icon: 'verified_user',
      route: '/tools-dev/ssl-check',
      group: 'Dev Tools',
      keywords: ['ssl', 'cert', 'expired', 'verify'],
    },
    {
      label: 'GSLB',
      icon: 'dns',
      route: '/tools-dev/gslb',
      group: 'Dev Tools',
      keywords: ['dns', 'gslb', 'suspend', 'monitor'],
    },
  ];

  readonly piket: NavEntry[] = [
    {
      label: 'List Keluhan',
      icon: 'list_alt',
      route: '/piket/keluhan-list',
      group: 'Piket',
      keywords: ['complaint'],
    },
    {
      label: 'Fix Data User',
      icon: 'edit',
      route: '/piket/fix-data-user',
      group: 'Piket',
    },
    {
      label: 'Fix After Merge CIS',
      icon: 'merge_type',
      route: '/piket/fix-after-merge-cis',
      group: 'Piket',
    },
  ];

  readonly groups: ToolGroup[] = ['Encoders & Crypto', 'Text', 'Format & Data'];

  private readonly _favorites = signal<string[]>(this.read(FAV_KEY));
  private readonly _recents = signal<string[]>(this.read(RECENT_KEY));

  readonly favorites = this._favorites.asReadonly();
  readonly recents = this._recents.asReadonly();

  bySlug(slug: string): ToolEntry | undefined {
    return this.tools.find((t) => t.slug === slug);
  }

  isFavorite(slug: string): boolean {
    return this._favorites().includes(slug);
  }

  toggleFavorite(slug: string): void {
    const next = this._favorites().includes(slug)
      ? this._favorites().filter((s) => s !== slug)
      : [...this._favorites(), slug];
    this._favorites.set(next);
    this.write(FAV_KEY, next);
  }

  /** Record a tool as just-used; bumps it to the front of recents. */
  recordUse(slug: string): void {
    const next = [slug, ...this._recents().filter((s) => s !== slug)].slice(
      0,
      MAX_RECENT,
    );
    this._recents.set(next);
    this.write(RECENT_KEY, next);
  }

  /** Tools in a given group, optionally filtered by a search term. */
  toolsInGroup(group: ToolGroup, query = ''): ToolEntry[] {
    const q = query.trim().toLowerCase();
    return this.tools.filter(
      (t) => t.group === group && (!q || this.matches(t, q)),
    );
  }

  /** Search across every tool — used by the command palette. */
  searchTools(query: string): ToolEntry[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.tools;
    return this.tools.filter((t) => this.matches(t, q));
  }

  searchNav(query: string): NavEntry[] {
    const q = query.trim().toLowerCase();
    const all = [...this.devTools, ...this.piket];
    if (!q) return all;
    return all.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.route.toLowerCase().includes(q) ||
        (n.keywords ?? []).some((k) => k.includes(q)),
    );
  }

  private matches(t: ToolEntry, q: string): boolean {
    return (
      t.label.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.group.toLowerCase().includes(q) ||
      (t.keywords ?? []).some((k) => k.includes(q))
    );
  }

  private read(key: string): string[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      // Bad JSON would re-parse on every bootstrap; clear it so the state self-heals.
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      return [];
    }
  }

  private write(key: string, value: string[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota / privacy mode */
    }
  }
}
