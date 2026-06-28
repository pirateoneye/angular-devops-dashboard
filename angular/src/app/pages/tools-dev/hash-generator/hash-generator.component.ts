import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  private algorithms = ['MD5', 'SHA1', 'SHA256', 'SHA512', 'SHA3', 'RIPEMD160'];

  constructor(private snackBar: MatSnackBar) {}

  generate(): void {
    this.results = this.algorithms
      .map((algo) => {
        try {
          const fn = (CryptoJS as unknown as Record<string, (s: string) => { toString: () => string }>)[algo];
          const hash = fn ? fn(this.input).toString() : '';
          return { algo, hash };
        } catch {
          return { algo, hash: '(not supported in this build)' };
        }
      })
      .filter((r) => r.hash);
  }

  copy(value: string): void {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() =>
      this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
    );
  }
}