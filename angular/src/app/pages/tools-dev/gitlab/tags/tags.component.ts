import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  input,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { GitLabService } from '../../../../shared/service/gitlab/gitlab.service';
import { GitLabTag, tagDate } from '../../../../shared/service/gitlab/gitlab-api';
import { GitlabActivityService } from '../gitlab-activity.service';
import { tagAgeText, tagAgeColor } from '../types';
import { mapWithConcurrency } from '../../../../shared/service/gitlab/gitlab-batch';

interface TagRow {
  project: { id: number; name: string; path_with_namespace: string };
  latestTag: GitLabTag | null;
  tagDate: string | null;
  tags: GitLabTag[];
  error: string | null;
}

interface TagResult {
  pid: number;
  proj: { id: number; name: string; path_with_namespace: string };
  tags: GitLabTag[];
  branchNames: string[];
  error: string | null;
}

@Component({
  standalone: true,
  selector: 'gl-tags',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagsComponent implements OnInit {
  readonly svc = inject(GitLabService);
  readonly activity = inject(GitlabActivityService);
  readonly selectedIds = input.required<number[]>();
  readonly expandAll = signal(false);
  readonly addingTag = signal<number | null>(null);
  readonly tagName = signal('');
  readonly tagBranch = signal('main');
  readonly tagMessage = signal('');
  readonly savingTag = signal(false);
  readonly tagError = signal('');

  readonly rows = signal<TagRow[]>([]);
  readonly loading = signal(false);
  readonly branchList = signal<string[]>(['main', 'develop', 'staging', 'master']);

  async ngOnInit(): Promise<void> {
    await this.loadTags();
  }
  async loadTags(): Promise<void> {
    this.loading.set(true);
    const ids = this.selectedIds();
    this.activity.append(`Loading tags for ${ids.length} project(s)`, 'info');
    const results: TagResult[] = await mapWithConcurrency<number, TagResult>(
      ids,
      8,
      async (pid: number): Promise<TagResult> => {
        const proj = this.svc.projects().find(p => p.id === pid)!;
        try {
          const [tags, branches] = await Promise.all([
            this.svc.listProjectTags(pid, { orderBy: 'updated_at', sort: 'desc', perPage: 10 }),
            this.svc.listProjectBranches(pid),
          ]);
          return { pid, proj, tags, branchNames: branches.map((b: { name: string }) => b.name), error: null };
        } catch (e) {
          return { pid, proj, tags: [], branchNames: [], error: e instanceof Error ? e.message : 'Failed' };
        }
      },
    );

    const allBranches = new Set(this.branchList());
    for (const r of results) {
      for (const b of r.branchNames) allBranches.add(b);
    }
    this.branchList.set([...allBranches].sort());

    const tagRows = results.map((r: TagResult): TagRow => ({
      project: r.proj,
      latestTag: r.tags[0] ?? null,
      tagDate: r.tags[0] ? tagDate(r.tags[0]) ?? null : null,
      tags: r.tags,
      error: r.error,
    }));
    this.rows.set(tagRows);
    this.loading.set(false);

    const errors = results.filter((r) => r.error).length;
    this.activity.append(
      `Loaded tags — ${tagRows.length} project(s)${errors > 0 ? `, ${errors} error(s)` : ''}`,
      errors > 0 ? 'warn' : 'ok',
    );
  }

  async saveTag(pid: number): Promise<void> {
    const name = this.tagName().trim();
    const ref = this.tagBranch().trim();
    if (!name || !ref) return;
    this.savingTag.set(true);
    this.tagError.set('');
    const proj = this.svc.projects().find(p => p.id === pid);
    const projLabel = proj ? proj.name : `#${pid}`;
    this.activity.append(`Creating tag "${name}" on ${projLabel}`, 'info');
    try {
      const results = await this.svc.execute('tag', [pid], { source: ref, tagName: name });
      const result = results[0];
      if (!result.success) throw new Error(result.error ?? 'Failed to create tag');
      this.addingTag.set(null);
      this.tagName.set('');
      this.tagMessage.set('');
      this.activity.append(`Tag "${name}" created on ${projLabel}`, 'ok');
      await this.loadTags();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create tag';
      this.tagError.set(msg);
      this.activity.append(`Tag "${name}" failed on ${projLabel}: ${msg}`, 'err');
    }
    this.savingTag.set(false);
  }

  readonly tagAgeText = tagAgeText;
  readonly tagAgeColor = tagAgeColor;

}
