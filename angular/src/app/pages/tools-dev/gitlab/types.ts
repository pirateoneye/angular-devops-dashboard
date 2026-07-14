// Shared types and interfaces for GitLab sub-components.
// Each child component imports from here instead of defining its own types.



export interface ActionDef {
  id: 'tag' | 'merge';
  name: string;
  icon: string;
  desc: string;
  danger?: boolean;
}


export type SortKey = 'projectName' | 'latestTag' | 'tagDate';
export type SortDir = 'asc' | 'desc';
export type FilterChip = 'all' | 'tagged' | 'untagged';
export type ViewName = 'connect' | 'dashboard' | 'tags' | 'bulk';

export interface ExecResult {
  projectId: number;
  projectName: string;
  success: boolean;
  action: string;
  status: 'pending' | 'running' | 'done';
  detail?: string;
  error?: string;
  mrUrl?: string;
  mrIid?: number;
  source?: string;
  target?: string;
}

export interface PreviewResult {
  projectId: number;
  projectName: string;
  ok: boolean;
  reasons: string[];
  detail: string;
}
/** Days since a date string. Shared by dashboard + tags components. */
export function tagAgeDays(date: string | null): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

export function tagAgeText(date: string | null): string {
  const days = tagAgeDays(date);
  if (days === null) return '—';
  if (days === 0) return 'today';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

export function tagAgeColor(date: string | null): string {
  const days = tagAgeDays(date);
  if (days === null) return 'gray';
  if (days <= 7) return 'green';
  if (days <= 30) return 'orange';
  return 'red';
}
