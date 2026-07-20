import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-hash-generator',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatIconModule],
  templateUrl: './hash-generator.component.html',
  styleUrls: ['./hash-generator.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HashGeneratorComponent {
  input = '';
  results: { algo: string; hash: string }[] = [];
  copiedIndex: number | null = null;
  copiedAll = false;
  private algorithms = ['MD5', 'SHA1', 'SHA256', 'SHA512', 'SHA3', 'RIPEMD160'];

  private readonly cdr = inject(ChangeDetectorRef);

  @HostListener('execute') onExecute(): void {
    this.generate();
  }

  autoMode = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  onInputChange(): void {
    if (!this.autoMode) return;
    clearTimeout(this.debounceTimer ?? undefined);
    this.debounceTimer = setTimeout(() => this.generate(), 300);
  }

  generate(): void {
    this.results = this.algorithms
      .map((algo) => {
        try {
          const fn = (
            CryptoJS as unknown as Record<
              string,
              (s: string) => { toString: () => string }
            >
          )[algo];
          const hash = fn ? fn(this.input).toString() : '';
          return { algo, hash };
        } catch {
          return { algo, hash: '(not supported in this build)' };
        }
      })
      .filter((r) => r.hash);
  }

  copy(value: string, index: number): void {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      this.copiedIndex = index;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copiedIndex = null;
        this.cdr.markForCheck();
      }, 1500);
    });
  }

  copyAll(): void {
    const text = this.results.map((r) => `${r.algo}: ${r.hash}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      this.copiedAll = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copiedAll = false;
        this.cdr.markForCheck();
      }, 1500);
    });
  }
}
