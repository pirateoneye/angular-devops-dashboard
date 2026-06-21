import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-unicode-escape',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule],
  templateUrl: './unicode-escape.component.html',
  styleUrls: ['./unicode-escape.component.css'],
})
export class UnicodeEscapeComponent {
  input = '';
  output = '';

  constructor(private snackBar: MatSnackBar) {}

  encode(): void {
    this.output = [...this.input].map((c) => {
      const cp = c.codePointAt(0)!;
      if (cp > 0x7e || cp < 0x20) {
        return cp > 0xffff ? `\\u{${cp.toString(16)}}` : `\\u${cp.toString(16).padStart(4, '0')}`;
      }
      return c;
    }).join('');
  }

  decode(): void {
    this.output = this.input.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})/g,
      (_m, a: string | undefined, b: string | undefined, c: string | undefined) =>
        String.fromCodePoint(parseInt((a || b || c)!, 16)),
    );
  }

  copy(): void {
    if (!this.output) return;
    navigator.clipboard.writeText(this.output).then(() =>
      this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
    );
  }
}