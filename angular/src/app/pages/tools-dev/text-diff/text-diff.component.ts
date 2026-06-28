import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';

interface DiffLine {
  type: 'add' | 'del' | 'eq';
  text: string;
}

@Component({
  selector: 'app-text-diff',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule],
  templateUrl: './text-diff.component.html',
  styleUrls: ['./text-diff.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextDiffComponent {
  left = '';
  right = '';
  diff: DiffLine[] = [];
  added = 0;
  removed = 0;
  unchanged = 0;

  compare(): void {
    const a = this.left.split('\n');
    const b = this.right.split('\n');
    const m = a.length;
    const n = b.length;
    // LCS table
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const out: DiffLine[] = [];
    let i = 0;
    let j = 0;
    this.added = this.removed = this.unchanged = 0;
    while (i < m && j < n) {
      if (a[i] === b[j]) {
        out.push({ type: 'eq', text: a[i] });
        this.unchanged++;
        i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        out.push({ type: 'del', text: a[i] });
        this.removed++;
        i++;
      } else {
        out.push({ type: 'add', text: b[j] });
        this.added++;
        j++;
      }
    }
    while (i < m) { out.push({ type: 'del', text: a[i++] }); this.removed++; }
    while (j < n) { out.push({ type: 'add', text: b[j++] }); this.added++; }
    this.diff = out;
  }

  clear(): void {
    this.left = '';
    this.right = '';
    this.diff = [];
    this.added = this.removed = this.unchanged = 0;
  }
}