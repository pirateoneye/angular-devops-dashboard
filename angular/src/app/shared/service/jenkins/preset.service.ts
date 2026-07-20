// preset.service.ts
// Save/load/delete named parameter presets in localStorage.

import { Injectable, signal } from '@angular/core';
import { ParamPreset } from './jenkins.models';

const LS_KEY = 'jenkins-presets';

function loadPresets(): ParamPreset[] {
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

function savePresets(presets: ParamPreset[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(presets));
  } catch {
    /* ignore quota / private mode */
  }
}

function uuid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

@Injectable({ providedIn: 'root' })
export class PresetService {
  readonly presets = signal<ParamPreset[]>(loadPresets());
  readonly activePresetId = signal<string | null>(null);

  save(name: string, jobName: string, params: Record<string, string | boolean>): ParamPreset {
    const now = Date.now();
    const preset: ParamPreset = {
      id: uuid(),
      name,
      jobName,
      params: { ...params },
      createdAt: now,
      updatedAt: now,
    };
    this.presets.update((arr) => [...arr, preset]);
    savePresets(this.presets());
    return preset;
  }

  delete(id: string): void {
    this.presets.update((arr) => arr.filter((p) => p.id !== id));
    if (this.activePresetId() === id) this.activePresetId.set(null);
    savePresets(this.presets());
  }

  load(id: string): ParamPreset | undefined {
    return this.presets().find((p) => p.id === id);
  }

  rename(id: string, newName: string): void {
    this.presets.update((arr) =>
      arr.map((p) => (p.id === id ? { ...p, name: newName, updatedAt: Date.now() } : p)),
    );
    savePresets(this.presets());
  }

  overwrite(id: string, params: Record<string, string | boolean>): void {
    this.presets.update((arr) =>
      arr.map((p) => (p.id === id ? { ...p, params: { ...params }, updatedAt: Date.now() } : p)),
    );
    savePresets(this.presets());
  }

  /** Get presets for a given jobName, newest first. */
  forJob(jobName: string): ParamPreset[] {
    return this.presets()
      .filter((p) => p.jobName === jobName)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Apply a preset to a different job.
   * Returns { applied: Record<string,string|boolean>, matchedCount: number, totalCount: number }
   */
  applyCrossJob(presetId: string, targetParamDefs: Array<{ name: string }>): {
    applied: Record<string, string | boolean>;
    matched: number;
    total: number;
  } {
    const preset = this.load(presetId);
    if (!preset) return { applied: {}, matched: 0, total: 0 };

    const targetNames = new Set(targetParamDefs.map((d) => d.name));
    const applied: Record<string, string | boolean> = {};
    let matched = 0;

    for (const [key, value] of Object.entries(preset.params)) {
      if (targetNames.has(key)) {
        applied[key] = value;
        matched++;
      }
    }
    return { applied, matched, total: Object.keys(preset.params).length };
  }
}
