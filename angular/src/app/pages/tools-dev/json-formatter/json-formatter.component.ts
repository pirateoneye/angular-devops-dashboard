import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-json-formatter',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatIconModule],
  templateUrl: './json-formatter.component.html',
  styleUrls: ['./json-formatter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonFormatterComponent {
  input = '';
  output = '';
  error = '';
  stats = '';

  constructor(private snackBar: MatSnackBar) {}

  private parse(): unknown | null {
    this.error = '';
    this.stats = '';
    if (!this.input.trim()) {
      this.error = 'Input kosong.';
      return null;
    }
    try {
      return JSON.parse(this.input);
    } catch (e) {
      this.error = 'JSON tidak valid: ' + (e as Error).message;
      return null;
    }
  }

  format(): void {
    const data = this.parse();
    if (data === null) return;
    this.output = JSON.stringify(data, null, 2);
    this.setStats(data);
  }

  minify(): void {
    const data = this.parse();
    if (data === null) return;
    this.output = JSON.stringify(data);
    this.setStats(data);
  }

  validate(): void {
    const data = this.parse();
    if (data === null) {
      this.snackBar.open('JSON tidak valid', 'Close', { duration: 2000 });
      return;
    }
    this.output = '';
    this.snackBar.open('JSON valid ✓', 'Close', { duration: 2000 });
    this.setStats(data);
  }

  clear(): void {
    this.input = '';
    this.output = '';
    this.error = '';
    this.stats = '';
  }

  copyOutput(): void {
    this.copy(this.output);
  }

  copy(value: string): void {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() =>
      this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
    );
  }

  private setStats(data: unknown): void {
    const bytes = new Blob([this.input]).size;
    this.stats = `${bytes} bytes`;
  }
}