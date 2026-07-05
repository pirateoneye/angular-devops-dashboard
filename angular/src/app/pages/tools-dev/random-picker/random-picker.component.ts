import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

interface PickResult {
  value: string;
  index: number;
}

@Component({
  selector: 'app-random-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './random-picker.component.html',
  styleUrls: ['./random-picker.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RandomPickerComponent {
  input = '';
  count = 1;
  unique = true;
  sortResult = false;

  picks: PickResult[] = [];
  shuffled: string[] = [];
  error = '';
  copied = false;
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private snackBar: MatSnackBar) {}

  get items(): string[] {
    return this.input
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l !== '');
  }

  get picksText(): string {
    return this.picks.map((p) => p.value).join('\n');
  }

  get shuffledText(): string {
    return this.shuffled.join('\n');
  }

  get tooFew(): boolean {
    return this.items.length > 0 && this.items.length < 2;
  }

  pick(): void {
    this.error = '';
    const items = this.items;
    if (items.length === 0) {
      this.error = 'Masukkan minimal satu item.';
      this.picks = [];
      return;
    }
    if (items.length < 2) {
      this.error = 'Enter at least 2 items to pick from';
      this.picks = [];
      return;
    }
    const want = Math.max(1, this.count);
    if (this.unique && want > items.length) {
      this.error = `Hanya ada ${items.length} item unik, minta ${want}.`;
      this.picks = [];
      return;
    }

    const pool = items.map((value, index) => ({ value, index }));
    const result: PickResult[] = [];
    if (this.unique) {
      const arr = [...pool];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      for (let k = 0; k < want; k++) result.push(arr[k]);
    } else {
      for (let k = 0; k < want; k++) {
        result.push(pool[Math.floor(Math.random() * pool.length)]);
      }
    }
    this.picks = this.sortResult
      ? [...result].sort((a, b) => a.value.localeCompare(b.value))
      : result;
  }

  shuffle(): void {
    this.error = '';
    const items = this.items;
    if (items.length === 0) {
      this.error = 'Masukkan minimal satu item.';
      this.shuffled = [];
      return;
    }
    if (items.length < 2) {
      this.error = 'Enter at least 2 items to pick from';
      this.shuffled = [];
      return;
    }
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    this.shuffled = arr;
  }

  copy(text: string): void {
    if (!text) return;
    if (this.copyTimer) clearTimeout(this.copyTimer);
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.copied = true;
        this.copyTimer = setTimeout(() => {
          this.copied = false;
        }, 1500);
        this.snackBar.open('Disalin', 'Close', { duration: 1200 });
      })
      .catch(() => {
        this.error =
          'Gagal menyalin ke clipboard. Pastikan situs diakses melalui HTTPS atau localhost.';
      });
  }

  clear(): void {
    this.input = '';
    this.picks = [];
    this.shuffled = [];
    this.error = '';
    this.copied = false;
  }

  example(): void {
    this.input = 'Apel\nMangga\nJeruk\nPisang\nAnggur\nSemangka\nMelon\nNanas';
  }
}
