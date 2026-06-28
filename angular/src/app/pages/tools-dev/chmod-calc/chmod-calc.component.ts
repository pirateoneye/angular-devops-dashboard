import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

type Group = 'owner' | 'group' | 'other';
interface PermBits { read: boolean; write: boolean; execute: boolean; }

@Component({
  selector: 'app-chmod-calc',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './chmod-calc.component.html',
  styleUrls: ['./chmod-calc.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChmodCalcComponent {
  perms: Record<Group, PermBits> = {
    owner: { read: true, write: true, execute: true },
    group: { read: true, write: false, execute: true },
    other: { read: true, write: false, execute: false },
  };

  setuid = false;
  setgid = false;
  sticky = false;

  inputStr = '';
  parseError = '';

  groups: { key: Group; label: string; letter: string }[] = [
    { key: 'owner', label: 'Owner', letter: 'u' },
    { key: 'group', label: 'Group', letter: 'g' },
    { key: 'other', label: 'Other', letter: 'o' },
  ];

  presets = ['755', '644', '600', '700', '666', '777', '750', '511'];

  constructor(private snackBar: MatSnackBar) {}

  private bitsValue(b: PermBits): number {
    return (b.read ? 4 : 0) + (b.write ? 2 : 0) + (b.execute ? 1 : 0);
  }

  get octal(): string {
    const special = (this.setuid ? 4 : 0) + (this.setgid ? 2 : 0) + (this.sticky ? 1 : 0);
    const o = this.bitsValue(this.perms.owner);
    const g = this.bitsValue(this.perms.group);
    const t = this.bitsValue(this.perms.other);
    return `${special}${o}${g}${t}`;
  }

  get octalNoSpecial(): string {
    return `${this.bitsValue(this.perms.owner)}${this.bitsValue(this.perms.group)}${this.bitsValue(this.perms.other)}`;
  }

  private symGroup(b: PermBits, special: boolean, specialChar: string): string {
    const r = b.read ? 'r' : '-';
    const w = b.write ? 'w' : '-';
    let x: string;
    if (special) {
      x = b.execute ? specialChar.toLowerCase() : specialChar.toUpperCase();
    } else {
      x = b.execute ? 'x' : '-';
    }
    return `${r}${w}${x}`;
  }

  get symbolic(): string {
    return (
      this.symGroup(this.perms.owner, this.setuid, 's') +
      this.symGroup(this.perms.group, this.setgid, 's') +
      this.symGroup(this.perms.other, this.sticky, 't')
    );
  }

  get rwxNotation(): string {
    return this.symbolic;
  }

  get summary(): string {
    const parts: string[] = [];
    if (this.setuid) parts.push('setuid');
    if (this.setgid) parts.push('setgid');
    if (this.sticky) parts.push('sticky-bit');
    const desc: string[] = [];
    const o = this.perms.owner;
    if (o.read && o.write && o.execute) desc.push('pemilik penuh');
    if (this.perms.other.write) desc.push('world-writable (berbahaya)');
    return (parts.length ? parts.join(', ') + ' · ' : '') + (desc.length ? desc.join(', ') : 'aman');
  }

  toggleAll(group: Group, value: boolean): void {
    this.perms[group] = { read: value, write: value, execute: value };
  }

  applyPreset(octal: string): void {
    this.parseOctal(octal);
  }

  parseInput(): void {
    this.parseError = '';
    const raw = this.inputStr.trim();
    if (!raw) return;
    if (/^[0-7]{3,4}$/.test(raw)) {
      this.parseOctal(raw);
      this.snackBar.open('Diterapkan', 'Close', { duration: 1200 });
      return;
    }
    const clean = raw.replace(/[^rwxst-]/gi, '').toLowerCase();
    if (/^([r-][w-][xst-]){3}$/.test(clean)) {
      this.parseSymbolic(clean);
      this.snackBar.open('Diterapkan', 'Close', { duration: 1200 });
      return;
    }
    this.parseError = 'Format tidak dikenali. Contoh oktal: 755 — simbolik: rwxr-xr-x.';
  }

  private parseOctal(octal: string): void {
    let special = 0;
    let rest = octal;
    if (octal.length === 4) {
      special = parseInt(octal[0], 8);
      rest = octal.slice(1);
    }
    this.setuid = !!(special & 4);
    this.setgid = !!(special & 2);
    this.sticky = !!(special & 1);
    const toBits = (n: number): PermBits => ({ read: !!(n & 4), write: !!(n & 2), execute: !!(n & 1) });
    this.perms.owner = toBits(parseInt(rest[0], 8));
    this.perms.group = toBits(parseInt(rest[1], 8));
    this.perms.other = toBits(parseInt(rest[2], 8));
  }

  private parseSymbolic(sym: string): void {
    const grp = (start: number) => sym.slice(start, start + 3);
    const toBits = (s: string, specialChar: string): { b: PermBits; special: boolean } => ({
      b: { read: s[0] === 'r', write: s[1] === 'w', execute: s[2] === 'x' || s[2] === specialChar.toLowerCase() },
      special: s[2] === specialChar.toLowerCase() || s[2] === specialChar.toUpperCase(),
    });
    const o = toBits(grp(0), 's');
    const g = toBits(grp(3), 's');
    const t = toBits(grp(6), 't');
    this.perms.owner = o.b; this.setuid = o.special;
    this.perms.group = g.b; this.setgid = g.special;
    this.perms.other = t.b; this.sticky = t.special;
  }

  copy(v: string): void {
    navigator.clipboard.writeText(v).then(() =>
      this.snackBar.open('Disalin', 'Close', { duration: 1200 }),
    );
  }
}
