// build-history.service.ts
// Audit trail of all triggered builds, persisted in localStorage.

import { Injectable, signal } from '@angular/core';
import { BuildRecord } from './jenkins.models';

const LS_KEY = 'jenkins-build-history';
const MAX_ENTRIES = 200;

function loadRecords(): BuildRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveRecords(records: BuildRecord[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(records));
}


@Injectable({ providedIn: 'root' })
export class BuildHistoryService {
  readonly records = signal<BuildRecord[]>(loadRecords());
  readonly collapsed = signal(true);

  append(record: BuildRecord): void {
    this.records.update((arr) => {
      const next = [record, ...arr];
      if (next.length > MAX_ENTRIES) next.length = MAX_ENTRIES;
      saveRecords(next);
      return next;
    });
  }

  clear(): void {
    this.records.set([]);
    saveRecords([]);
  }

  toggle(): void {
    this.collapsed.update((v) => !v);
  }
}
