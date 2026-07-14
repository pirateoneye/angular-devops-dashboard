import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivityService, ActivityEntry } from '../../service/activity.service';

@Component({
  standalone: true,
  selector: 'app-activity-feed',
  imports: [MatIconModule],
  templateUrl: './activity-feed.component.html',
  styles: [`
    :host { display: block; }
    .feed { position: fixed; bottom: 0; left: 0; right: 0; z-index: 100; background: var(--msv-surface-1); border-top: 1px solid var(--msv-border); font-size: 12px; }
    .feed-bar { display: flex; align-items: center; gap: 8px; padding: 6px 16px; cursor: pointer; }
    .feed-bar:hover { background: var(--msv-bg); }
    .feed-count { font-weight: 600; }
    .feed-body { max-height: 260px; overflow-y: auto; padding: 4px 16px 12px; }
    .entry { display: flex; align-items: center; gap: 6px; padding: 3px 0; border-bottom: 1px solid var(--msv-surface-2); }
    .entry:last-child { border-bottom: none; }
    .entry .ico { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }
    .entry .src { font-size: 10px; text-transform: uppercase; padding: 1px 4px; border-radius: 3px; flex-shrink: 0; }
    .entry .msg { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .entry .ts { font-size: 10px; color: var(--msv-text-dim); flex-shrink: 0; font-family: monospace; }
    .clear-btn { background: none; border: none; color: var(--msv-text-dim); cursor: pointer; font-size: 11px; padding: 2px 6px; }
    .clear-btn:hover { color: var(--msv-error); }
  `],
})
export class ActivityFeedComponent {
  readonly feed = inject(ActivityService);

  toggle(): void { this.feed.toggle(); }
  clear(): void { this.feed.clear(); }

  srcLabel(s: ActivityEntry['source']): string {
    return s;
  }

  timeStr(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
