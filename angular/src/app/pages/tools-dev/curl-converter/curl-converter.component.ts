import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClipboardService } from '../../../shared/service/clipboard/clipboard.service';

type OutputLang = 'javascript' | 'python' | 'go' | 'httpie';

interface ParsedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  auth: { type: 'bearer' | 'basic'; value: string } | null;
}

const LANG_OPTIONS: { id: OutputLang; label: string; icon: string }[] = [
  { id: 'javascript', label: 'JavaScript', icon: 'code' },
  { id: 'python', label: 'Python', icon: 'terminal' },
  { id: 'go', label: 'Go', icon: 'rocket_launch' },
  { id: 'httpie', label: 'HTTPie', icon: 'http' },
];

@Component({
  selector: 'app-curl-converter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './curl-converter.component.html',
  styleUrls: ['./curl-converter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurlConverterComponent {
  private readonly clipboardSvc = inject(ClipboardService);
  private readonly snackBar = inject(MatSnackBar);

  readonly input = signal('');
  readonly outputLang = signal<OutputLang>('javascript');
  readonly copied = signal(false);

  readonly langOptions = LANG_OPTIONS;

  /** Parse a curl command into a structured request. */
  private parseCurl(curl: string): ParsedRequest | null {
    const text = curl.trim().replace(/\\\s*\n\s*/g, ' ').replace(/^curl\s+/i, '');
    if (!text) return null;

    // Tokenize — split by spaces but respect quotes
    const tokens: string[] = [];
    let current = '';
    let inQuote: '"' | "'" | null = null;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuote) {
        if (c === inQuote) inQuote = null;
        current += c;
      } else if (c === '"' || c === "'") {
        inQuote = c;
        current += c;
      } else if (/\s/.test(c)) {
        if (current) tokens.push(current);
        current = '';
      } else {
        current += c;
      }
    }
    if (current) tokens.push(current);

    const req: ParsedRequest = {
      method: 'GET',
      url: '',
      headers: {},
      body: null,
      auth: null,
    };

    let i = 0;
    while (i < tokens.length) {
      const tok = tokens[i];

      // URL — first non-flag token
      if (!tok.startsWith('-') && !req.url) {
        req.url = this.stripQuotes(tok);
        i++;
        continue;
      }

      switch (tok) {
        case '-X':
        case '--request': {
          if (tokens[i + 1]) req.method = this.stripQuotes(tokens[i + 1]).toUpperCase();
          i += 2;
          break;
        }
        case '-H':
        case '--header': {
          const h = this.stripQuotes(tokens[i + 1] ?? '');
          const colonIdx = h.indexOf(':');
          if (colonIdx !== -1) {
            const k = h.slice(0, colonIdx).trim();
            const v = h.slice(colonIdx + 1).trim();
            req.headers[k] = v;
          }
          i += 2;
          break;
        }
        case '-d':
        case '--data':
        case '--data-raw':
        case '--data-binary': {
          req.body = this.stripQuotes(tokens[i + 1] ?? '');
          if (req.method === 'GET') req.method = 'POST';
          i += 2;
          break;
        }
        case '--compressed':
        case '-k':
        case '--insecure':
        case '-s':
        case '--silent':
        case '-S':
        case '--show-error':
        case '-i':
        case '--include':
        case '-L':
        case '--location':
          i++;
          break;
        case '-u':
        case '--user': {
          const cred = this.stripQuotes(tokens[i + 1] ?? '');
          req.auth = { type: 'basic', value: cred };
          i += 2;
          break;
        }
        default:
          if (tok.startsWith('-H')) {
            const h = this.stripQuotes(tok.slice(2) + (tokens[i + 1] ?? ''));
            const colonIdx = h.indexOf(':');
            if (colonIdx !== -1) {
              const k = h.slice(0, colonIdx).trim();
              const v = h.slice(colonIdx + 1).trim();
              req.headers[k] = v;
            }
            i += 2;
          } else {
            i++;
          }
      }
    }

    // Look for bearer token in headers
    const authHeader = req.headers['Authorization'] ?? req.headers['authorization'];
    if (authHeader?.toLowerCase().startsWith('bearer ')) {
      req.auth = { type: 'bearer', value: authHeader.slice(7) };
      delete req.headers['Authorization'];
      delete req.headers['authorization'];
    }

    return req.url ? req : null;
  }

  private stripQuotes(s: string): string {
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }
    return s;
  }

  readonly parsed = computed<ParsedRequest | null>(() => {
    const text = this.input();
    if (!text.trim()) return null;
    return this.parseCurl(text);
  });

  readonly error = computed(() => {
    const text = this.input();
    if (!text.trim()) return '';
    if (!text.trim().toLowerCase().startsWith('curl ')) {
      return 'Perintah harus dimulai dengan "curl".';
    }
    if (!this.parsed()) return 'Tidak bisa parse URL dari command ini.';
    return '';
  });

  readonly output = computed(() => {
    const req = this.parsed();
    if (!req) return '';
    return this.format(req);
  });

  readonly stats = computed(() => {
    const req = this.parsed();
    if (!req) return null;
    return {
      method: req.method,
      headerCount: Object.keys(req.headers).length,
      hasBody: req.body !== null,
    };
  });

  private format(req: ParsedRequest): string {
    switch (this.outputLang()) {
      case 'javascript':
        return this.toJavaScript(req);
      case 'python':
        return this.toPython(req);
      case 'go':
        return this.toGo(req);
      case 'httpie':
        return this.toHttpie(req);
      default:
        return '';
    }
  }

  /** JavaScript fetch() call. */
  private toJavaScript(req: ParsedRequest): string {
    const opts: string[] = [`  method: '${req.method}'`];
    const headers = { ...req.headers };
    if (req.auth?.type === 'bearer') headers['Authorization'] = `Bearer ${req.auth.value}`;
    if (Object.keys(headers).length > 0) {
      opts.push(`  headers: ${JSON.stringify(headers, null, 2).split('\n').join('\n  ')}`);
    }
    if (req.body) {
      const isJson = (headers['Content-Type'] ?? headers['content-type'] ?? '').includes('json');
      let bodyStr: string;
      if (isJson) {
        try {
          const parsed = JSON.parse(req.body);
          bodyStr = `JSON.stringify(${JSON.stringify(parsed, null, 0)})`;
        } catch {
          bodyStr = `JSON.stringify(${JSON.stringify(req.body, null, 0)})`;
        }
      } else {
        bodyStr = JSON.stringify(req.body);
      }
      opts.push(`  body: ${bodyStr}`);
    }
    const safeUrl = req.url.replace(/'/g, "\\'");
    return `const response = await fetch('${safeUrl}', {
${opts.join(',\n')}
});

const data = await response.json();
console.log(data);`;
  }

  /** Python requests library. */
  private toPython(req: ParsedRequest): string {
    const lines: string[] = ['import requests', ''];
    const headers: Record<string, string> = { ...req.headers };
    if (req.auth?.type === 'bearer') headers['Authorization'] = `Bearer ${req.auth.value}`;

    if (Object.keys(headers).length > 0) {
      lines.push(`headers = ${this.pyDict(headers, 1)}`);
    }

    let bodyVar = '';
    if (req.body) {
      const isJson = (headers['Content-Type'] ?? headers['content-type'] ?? '').includes('json');
      if (isJson) {
        try {
          const parsed = JSON.parse(req.body);
          lines.push(`payload = ${this.pyDict(parsed, 1)}`);
          bodyVar = ', json=payload';
        } catch {
          lines.push(`payload = ${this.pyStr(req.body)}`);
          bodyVar = ', data=payload';
        }
      } else {
        lines.push(`payload = ${this.pyStr(req.body)}`);
        bodyVar = ', data=payload';
      }
    }

    const method = req.method.toLowerCase();
    const args = [this.pyStr(req.url)];
    if (Object.keys(headers).length > 0) args.push('headers=headers');
    if (bodyVar) args.push(bodyVar.replace(', ', ''));

    lines.push('');
    lines.push(`response = requests.${method}(${args.join(', ')})`);
    lines.push('print(response.json())');
    return lines.join('\n');
  }

  /** Go net/http. */
  private toGo(req: ParsedRequest): string {
    const lines: string[] = ['package main', '', 'import (', '\t"io"', '\t"net/http"', ')', '', 'func main() {'];

    const bodySetup = req.body
      ? `\tbody := strings.NewReader(${JSON.stringify(req.body)})\n`
      : '';
    const method = req.method;
    const safeUrl = req.url.replace(/"/g, '\\"');
    const reqLine = req.body
      ? `\treq, err := http.NewRequest("${method}", "${safeUrl}", body)`
      : `\treq, err := http.NewRequest("${method}", "${safeUrl}", nil)`;

    lines.push(bodySetup);
    lines.push(reqLine);
    lines.push('\tif err != nil {');
    lines.push('\t\tpanic(err)');
    lines.push('\t}');

    for (const [k, v] of Object.entries(req.headers)) {
      lines.push(`\treq.Header.Set(${JSON.stringify(k)}, ${JSON.stringify(v)})`);
    }
    if (req.auth?.type === 'bearer') {
      lines.push(`\treq.Header.Set("Authorization", ${JSON.stringify('Bearer ' + req.auth.value)})`);
    } else if (req.auth?.type === 'basic') {
      lines.push(`\treq.SetBasicAuth(${JSON.stringify(req.auth.value)})`);
    }

    lines.push('');
    lines.push('\tresp, err := http.DefaultClient.Do(req)');
    lines.push('\tif err != nil {');
    lines.push('\t\tpanic(err)');
    lines.push('\t}');
    lines.push('\tdefer resp.Body.Close()');
    lines.push('\tio.ReadAll(resp.Body)');
    lines.push('}');

    if (req.body) {
      lines.splice(4, 0, '\t"strings"');
    }
    return lines.join('\n');
  }

  /** HTTPie command. */
  private toHttpie(req: ParsedRequest): string {
    const lines: string[] = ['http'];
    if (req.method !== 'GET') lines.push(req.method.toLowerCase());
    lines.push(req.url);
    for (const [k, v] of Object.entries(req.headers)) {
      lines.push(`${this.shellEscape(k)}:${this.shellEscape(v)}`);
    }
    if (req.auth?.type === 'bearer') {
      lines.push(`Authorization:Bearer ${this.shellEscape(req.auth.value)}`);
    }
    if (req.body) {
      lines.push(`<<<'EOF'`);
      lines.push(req.body);
      lines.push('EOF');
    }
    return lines.join(' \\\n  ');
  }

  /** Format a Python dict from a JS object. */
  private pyDict(obj: Record<string, unknown>, indent = 0): string {
    const pad = '    '.repeat(indent);
    const entries = Object.entries(obj).map(([k, v]) => {
      const value =
        typeof v === 'string' ? this.pyStr(v) :
        typeof v === 'number' || typeof v === 'boolean' ? String(v) :
        v === null ? 'None' :
        Array.isArray(v) ? `[${v.map((x) => this.pyVal(x, indent + 1)).join(', ')}]` :
        typeof v === 'object' ? this.pyDict(v as Record<string, unknown>, indent + 1) :
        'None';
      return `${pad}    '${k}': ${value}`;
    });
    return `{\n${entries.join(',\n')}\n${pad}}`;
  }

  private pyVal(v: unknown, indent: number): string {
    if (typeof v === 'string') return this.pyStr(v);
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (v === null) return 'None';
    if (typeof v === 'object') return this.pyDict(v as Record<string, unknown>, indent);
    return 'None';
  }

  private pyStr(s: string): string {
    return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  }

  /** Escape a value for safe shell usage — wraps in single quotes, escapes internal single quotes. */
  private shellEscape(s: string): string {
    return `'${s.replace(/'/g, "'\\''")}'`;
  }

  pasteSample(): void {
    this.input.set(`curl -X POST 'https://api.example.com/v1/users' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' \\
  -H 'X-Request-ID: abc-123' \\
  -d '{"name":"John Doe","email":"john@example.com","age":30}'`);
  }

  clear(): void {
    this.input.set('');
    this.copied.set(false);
  }
  async copyOutput(): Promise<void> {
    const text = this.output();
    if (!text) return;
    const ok = await this.clipboardSvc.copy(text);
    if (ok) {
      this.snackBar.open('Copied to clipboard', 'Dismiss', { duration: 1500 });
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } else {
      this.snackBar.open('Copy failed', 'Dismiss', { duration: 2000 });
    }
  }
}