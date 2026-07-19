import { TestBed } from '@angular/core/testing';

import { ActivityService } from './activity.service';

describe('ActivityService', () => {
  let service: ActivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityService);
  });

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  describe('log()', () => {
    it('appends an entry to the feed', () => {
      service.log('jenkins', 'Build queued', 'ok');
      const entries = service.entries();
      expect(entries.length).toBe(1);
      expect(entries[0].source).toBe('jenkins');
      expect(entries[0].message).toBe('Build queued');
      expect(entries[0].kind).toBe('ok');
      expect(entries[0].ts).toBeGreaterThan(0);
    });

    it('defaults kind to "info" when omitted', () => {
      service.log('gitlab', 'Pipeline started');
      expect(service.entries()[0].kind).toBe('info');
    });

    it('accepts every documented source including inventory', () => {
      const sources = ['jenkins', 'gitlab', 'gslb'] as const;
      sources.forEach((src, i) => service.log(src, `msg ${i}`));
      const entries = service.entries();
      expect(entries.map((e) => e.source)).toEqual(sources);
    });

    it('caps the feed at the max length, dropping oldest', () => {
      // maxLen is 100; push 105 entries and verify only the last 100 remain
      for (let i = 0; i < 105; i++) {
        service.log('jenkins', `entry ${i}`, 'ok');
      }
      const entries = service.entries();
      expect(entries.length).toBe(100);
      expect(entries[0].message).toBe('entry 5');
      expect(entries[99].message).toBe('entry 104');
    });

    it('accepts all four kind values', () => {
      const kinds = ['info', 'ok', 'warn', 'err'] as const;
      kinds.forEach((k) => service.log('jenkins', `msg-${k}`, k));
      const entries = service.entries();
      expect(entries.map((e) => e.kind)).toEqual(kinds);
    });
  });

  describe('clear()', () => {
    it('empties the feed', () => {
      service.log('jenkins', 'a');
      service.log('gitlab', 'b');
      expect(service.entries().length).toBe(2);
      service.clear();
      expect(service.entries().length).toBe(0);
    });
  });

  describe('toggle()', () => {
    it('flips the collapsed signal', () => {
      const before = service.collapsed();
      service.toggle();
      expect(service.collapsed()).toBe(!before);
      service.toggle();
      expect(service.collapsed()).toBe(before);
    });
  });

  describe('count computed', () => {
    it('tracks the number of entries', () => {
      expect(service.count()).toBe(0);
      service.log('jenkins', 'a');
      expect(service.count()).toBe(1);
      service.log('jenkins', 'b');
      expect(service.count()).toBe(2);
      service.clear();
      expect(service.count()).toBe(0);
    });
  });

  describe('iconFor()', () => {
    it('returns an icon for every source', () => {
      expect(service.iconFor('jenkins')).toBe('build_circle');
      expect(service.iconFor('gitlab')).toBe('merge_type');
      expect(service.iconFor('gslb')).toBe('dns');
    });
  });

  describe('colorFor()', () => {
    it('returns a CSS token for every kind', () => {
      expect(service.colorFor('ok')).toBe('var(--msv-success)');
      expect(service.colorFor('info')).toBe('var(--msv-primary)');
      expect(service.colorFor('warn')).toBe('var(--msv-warning)');
      expect(service.colorFor('err')).toBe('var(--msv-error)');
    });
  });
});