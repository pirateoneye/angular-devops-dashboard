import { TestBed } from '@angular/core/testing';
import { ToolCatalogService, ToolEntry, NavEntry, ToolGroup } from './tool-catalog.service';

describe('ToolCatalogService', () => {
  let svc: ToolCatalogService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ToolCatalogService);
  });

  afterAll(() => localStorage.clear());

  // ── Tools array integrity ──────────────────────────────────

  describe('tools array', () => {
    it('contains expected 15 tools', () => {
      expect(svc.tools.length).toBe(15);
    });

    it('every tool has a unique slug', () => {
      const slugs = svc.tools.map((t: ToolEntry) => t.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });

    it('every tool has a non-empty label, icon, and route', () => {
      for (const t of svc.tools) {
        expect(t.label.length).toBeGreaterThan(0);
        expect(t.icon.length).toBeGreaterThan(0);
        expect(t.route.length).toBeGreaterThan(0);
      }
    });

    it('all tools belong to a known group', () => {
      const known: ToolGroup[] = ['Encoders & Crypto', 'Text', 'Format & Data'];
      for (const t of svc.tools) {
        expect(known).toContain(t.group);
      }
    });

    it('each group has at least one tool', () => {
      const names = ['Encoders & Crypto', 'Text', 'Format & Data'];
      for (const g of names) {
        expect(svc.tools.filter((t: ToolEntry) => t.group === g).length)
          .withContext(g + ' should have tools')
          .toBeGreaterThan(0);
      }
    });

    it('SSL converter is in Encoders & Crypto group', () => {
      const ssl = svc.bySlug('ssl-converter');
      expect(ssl).toBeDefined();
      expect(ssl!.group).toBe('Encoders & Crypto');
    });

    it('every queryParams tool route is /utilities and has param t matching slug', () => {
      for (const t of svc.tools) {
        if (t.queryParams) {
          expect(t.route).toBe('/utilities');
          expect(t.queryParams.t).toBe(t.slug);
        }
      }
    });
  });

  // ── bySlug ──────────────────────────────────────────────────

  describe('bySlug', () => {
    it('returns a tool for each known slug', () => {
      const slugs = svc.tools.map((t: ToolEntry) => t.slug);
      for (const s of slugs) {
        expect(svc.bySlug(s)).toBeDefined();
      }
    });

    it('returns undefined for unknown slug', () => {
      expect(svc.bySlug('nonexistent-tool')).toBeUndefined();
    });
  });

  // ── Favorites ───────────────────────────────────────────────

  describe('favorites', () => {
    it('starts empty', () => {
      expect(svc.favorites()).toEqual([]);
    });

    it('isFavorite returns false for unmarked tool', () => {
      expect(svc.isFavorite('json-formatter')).toBeFalse();
    });

    it('toggleFavorite adds a slug', () => {
      svc.toggleFavorite('json-formatter');
      expect(svc.favorites()).toContain('json-formatter');
    });

    it('toggleFavorite removes a slug on second call', () => {
      svc.toggleFavorite('json-formatter');
      svc.toggleFavorite('json-formatter');
      expect(svc.favorites()).not.toContain('json-formatter');
    });

    it('persists favorites across service instances', () => {
      svc.toggleFavorite('decoder');
      svc.toggleFavorite('jwt-debugger');

      const svc2 = TestBed.inject(ToolCatalogService);
      expect(svc2.favorites()).toContain('decoder');
      expect(svc2.favorites()).toContain('jwt-debugger');
    });
  });

  // ── Recents ─────────────────────────────────────────────────

  describe('recents', () => {
    it('starts empty', () => {
      expect(svc.recents()).toEqual([]);
    });

    it('recordUse prepends the slug and caps at 5', () => {
      const slugs = ['a', 'b', 'c', 'd', 'e', 'f'];
      for (const s of slugs) svc.recordUse(s);
      const r = svc.recents();
      expect(r.length).toBe(5);
      expect(r[0]).toBe('f');
    });

    it('recordUse moves an existing slug to front', () => {
      svc.recordUse('hash-generator');
      svc.recordUse('ssl-converter');
      svc.recordUse('hash-generator');
      expect(svc.recents()[0]).toBe('hash-generator');
    });
  });

  // ── toolsInGroup ────────────────────────────────────────────

  describe('toolsInGroup', () => {
    it('returns all tools in Encoders & Crypto', () => {
      const group = svc.toolsInGroup('Encoders & Crypto');
      expect(group.length).toBeGreaterThan(0);
      for (const t of group) {
        expect(t.group).toBe('Encoders & Crypto');
      }
    });

    it('filters tools by query substring', () => {
      const results = svc.toolsInGroup('Text', 'regex');
      expect(results.length).toBe(1);
      expect(results[0].slug).toBe('regex-tester');
    });

    it('returns empty array for unknown group', () => {
      expect(svc.toolsInGroup('NotAGroup' as ToolGroup)).toEqual([]);
    });
  });

  // ── searchTools ─────────────────────────────────────────────

  describe('searchTools', () => {
    it('returns all tools for empty query', () => {
      expect(svc.searchTools('').length).toBe(15);
    });

    it('matches by label substring', () => {
      const r = svc.searchTools('Timestamp');
      expect(r.length).toBe(1);
      expect(r[0].slug).toBe('timestamp-converter');
    });

    it('matches by keyword', () => {
      const r = svc.searchTools('sha256');
      expect(r.length).toBe(1);
      expect(r[0].slug).toBe('hash-generator');
    });

    it('matches by slug', () => {
      const r = svc.searchTools('ssl');
      // 'ssl' matches ssl-converter slug AND image-base64 (keyword: 'base64' -> no)
      // Actually 'ssl' matches ssl-converter slug AND ssl-check devTool is not in tools[]
      expect(r.length).toBe(1);
      expect(r[0].slug).toBe('ssl-converter');
    });

    it('case-insensitive match by label — matches JSON label and group name', () => {
      // 'json' appears in json-formatter label and also in some other tool (group/keyword)
      const r = svc.searchTools('json');
      expect(r.length).toBeGreaterThanOrEqual(1);
      expect(r.some((t: ToolEntry) => t.slug === 'json-formatter')).toBeTrue();
    });
  });

  // ── searchNav ───────────────────────────────────────────────

  describe('searchNav', () => {
    it('returns all entries for empty query', () => {
      // searchNav returns all matches when query is empty
      const r = svc.searchNav('');
      expect(r.length).toBeGreaterThan(0);
    });

    it('returns matching inventory nav by label', () => {
      const r = svc.searchNav('Produk');
      expect(r.some((n: NavEntry) => n.label === 'Produk')).toBeTrue();
    });

    it('returns SSL Check dev tool by label', () => {
      const r = svc.searchNav('SSL').map((n: NavEntry) => n.label);
      expect(r).toContain('SSL Check');
    });

    it('returns matching piket entry by keyword', () => {
      // piket entry keywords: complaint etc, not 'vaksin'
      const r = svc.searchNav('complaint');
      expect(r.length).toBeGreaterThanOrEqual(1);
      expect(r[0].label).toBe('List Keluhan');
    });
  });

  // ── Nav arrays integrity ────────────────────────────────────

  describe('nav arrays', () => {
    it('devTools has unique routes', () => {
      const routes = svc.devTools.map((n: NavEntry) => n.route);
      expect(new Set(routes).size).toBe(routes.length);
    });

    it('devTools has 12 entries', () => {
      expect(svc.devTools.length).toBe(12);
    });

    it('inventory has 6 entries', () => {
      expect(svc.inventory.length).toBe(6);
    });

    it('inventory entries all belong to Inventory group', () => {
      for (const n of svc.inventory) {
        expect(n.group).toBe('Inventory');
      }
    });

    it('piket has 3 entries', () => {
      expect(svc.piket.length).toBe(3);
      for (const n of svc.piket) {
        expect(n.group).toBe('Piket');
      }
    });
  });

  // ── groups ──────────────────────────────────────────────────

  describe('groups', () => {
    it('has the three standard groups', () => {
      expect(svc.groups).toEqual(['Encoders & Crypto', 'Text', 'Format & Data']);
    });
  });
});
