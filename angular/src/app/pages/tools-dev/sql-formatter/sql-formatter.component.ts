import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-sql-formatter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './sql-formatter.component.html',
  styleUrls: ['./sql-formatter.component.css'],
})
export class SqlFormatterComponent {
  input = '';
  output = '';
  error = '';
  indent = '2';
  uppercaseKeywords = true;

  constructor(private snackBar: MatSnackBar) {}

  format(): void {
    this.error = '';
    this.output = '';
    if (!this.input.trim()) {
      this.error = 'Input SQL kosong.';
      return;
    }
    try {
      this.output = this.formatSql(this.input, Number(this.indent) || 2, this.uppercaseKeywords);
    } catch (e) {
      this.error = 'Format gagal: ' + (e as Error).message;
    }
  }

  minify(): void {
    this.error = '';
    this.output = '';
    if (!this.input.trim()) {
      this.error = 'Input SQL kosong.';
      return;
    }
    this.output = this.minifySql(this.input, this.uppercaseKeywords);
  }

  clear(): void {
    this.input = '';
    this.output = '';
    this.error = '';
  }

  copyOutput(): void {
    if (!this.output) return;
    navigator.clipboard.writeText(this.output).then(() =>
      this.snackBar.open('Disalin ke clipboard', 'Close', { duration: 1500 }),
    );
  }

  private formatSql(sql: string, indentSize: number, upper: boolean): string {
    const ind = ' '.repeat(indentSize);
    // Normalize whitespace.
    let tokens = this.tokenize(sql);
    if (upper) tokens = tokens.map((t) => this.isKeyword(t) ? t.toUpperCase() : t);

    let out = '';
    let depth = 0;
    let afterNewline = false;
    let prevType = '';
    const newline = () => { out += '\n' + ind.repeat(depth); afterNewline = true; };

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const up = t.toUpperCase();
      const isKw = this.isKeyword(t);
      const isOp = /^[(),]$/.test(t);
      const isClause = /^(SELECT|FROM|WHERE|AND|OR|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|UNION|UNION ALL|INSERT INTO|VALUES|SET|UPDATE|DELETE FROM|CREATE TABLE|CREATE INDEX|ALTER TABLE|DROP TABLE|ON|AS|WITH|RETURNING|INTO)$/i.test(up);

      if (up === '(') {
        if (!afterNewline && prevType !== '' && !/[(,]$/.test(prevType)) out += ' ';
        out += '(';
        // Keep simple parens inline unless contains many commas.
        const closing = this.matchParen(tokens, i);
        const inner = tokens.slice(i + 1, closing).join(' ');
        if (inner.split(',').length > 3 || inner.length > 60) {
          depth++;
          newline();
        }
        prevType = '(';
        continue;
      }
      if (up === ')') {
        if (depth > 0) { depth--; newline(); }
        out += ')';
        prevType = ')';
        continue;
      }
      if (t === ',') {
        out += ',';
        newline();
        prevType = ',';
        continue;
      }
      // Clauses that should start a new line at base depth.
      if (isClause && /^(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|UNION|UNION ALL|INSERT INTO|VALUES|SET|UPDATE|DELETE FROM|CREATE TABLE|CREATE INDEX|ALTER TABLE|DROP TABLE|WITH|RETURNING|INTO)$/i.test(up)) {
        if (out.length > 0) { while (depth > 0) depth--; out += '\n'; }
        out += up;
        if (up === 'SELECT' || /^(INSERT INTO|UPDATE|DELETE FROM|CREATE|ALTER|DROP|WITH)$/i.test(up)) newline();
        prevType = up;
        continue;
      }
      if (isKw && /^(AND|OR|ON|AS|JOIN|LEFT|RIGHT|INNER|OUTER|UNION|ALL|BY|HAVING)$/i.test(up)) {
        if (up === 'AND' || up === 'OR') { newline(); out += up + ' '; }
        else { out += ' ' + up + ' '; }
        prevType = up;
        continue;
      }
      // Normal token.
      if (!afterNewline && out.length > 0 && !/[(,]$/.test(out.slice(-1))) out += ' ';
      out += t;
      afterNewline = false;
      prevType = t;
    }
    // Collapse triple+ blank lines & trim trailing spaces.
    return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  private minifySql(sql: string, upper: boolean): string {
    let t = this.tokenize(sql);
    if (upper) t = t.map((x) => this.isKeyword(x) ? x.toUpperCase() : x);
    let out = '';
    t.forEach((x, i) => {
      const prev = i > 0 ? t[i - 1] : '';
      if (x === ',' || x === '(' || x === ')') out += x;
      else if (prev === '(' || out === '') out += x;
      else out += ' ' + x;
    });
    return out.replace(/\s+/g, ' ').trim();
  }

  private tokenize(sql: string): string[] {
    // Preserve quoted strings & identifiers, split keywords/operators/punctuation.
    const re = /('(?:[^']|'')*'|"(?:[^"]|"")*"|[(),]|<>|<=|>=|!=|=|<|>|\|\||\+|\-|\*|\/|%|;|\S+)/g;
    return (sql.match(re) ?? []).filter((s) => s.length > 0);
  }

  private isKeyword(t: string): boolean {
    const kw = ['SELECT','FROM','WHERE','AND','OR','NOT','NULL','IN','IS','LIKE','BETWEEN','GROUP','BY','ORDER','HAVING','LIMIT','OFFSET','JOIN','LEFT','RIGHT','INNER','OUTER','FULL','ON','AS','UNION','ALL','DISTINCT','INSERT','INTO','VALUES','SET','UPDATE','DELETE','CREATE','TABLE','INDEX','ALTER','DROP','WITH','RETURNING','CASE','WHEN','THEN','ELSE','END','ASC','DESC','EXISTS','COUNT','SUM','AVG','MIN','MAX','PRIMARY','KEY','FOREIGN','REFERENCES','DEFAULT','CONSTRAINT','UNIQUE','CHECK'];
    return kw.includes(t.toUpperCase());
  }

  private matchParen(tokens: string[], openIdx: number): number {
    let depth = 0;
    for (let i = openIdx; i < tokens.length; i++) {
      if (tokens[i] === '(') depth++;
      else if (tokens[i] === ')') { depth--; if (depth === 0) return i; }
    }
    return tokens.length - 1;
  }
}
