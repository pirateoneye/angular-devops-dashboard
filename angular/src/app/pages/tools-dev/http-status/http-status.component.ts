import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';

interface StatusRow { code: number; text: string; cat: '1xx' | '2xx' | '3xx' | '4xx' | '5xx'; desc: string; }

@Component({
  selector: 'app-http-status',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule],
  templateUrl: './http-status.component.html',
  styleUrls: ['./http-status.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HttpStatusComponent {
  query = signal('');
  statuses: StatusRow[] = [
    { code: 100, text: 'Continue', cat: '1xx', desc: 'Lanjutkan request.' },
    { code: 101, text: 'Switching Protocols', cat: '1xx', desc: 'Protokol switch.' },
    { code: 200, text: 'OK', cat: '2xx', desc: 'Request berhasil.' },
    { code: 201, text: 'Created', cat: '2xx', desc: 'Resource dibuat.' },
    { code: 202, text: 'Accepted', cat: '2xx', desc: 'Diterima, diproses async.' },
    { code: 204, text: 'No Content', cat: '2xx', desc: 'Berikut, tanpa body.' },
    { code: 206, text: 'Partial Content', cat: '2xx', desc: 'Range/partial response.' },
    { code: 301, text: 'Moved Permanently', cat: '3xx', desc: 'Redirect permanen.' },
    { code: 302, text: 'Found', cat: '3xx', desc: 'Redirect sementara.' },
    { code: 304, text: 'Not Modified', cat: '3xx', desc: 'Cache masih valid.' },
    { code: 307, text: 'Temporary Redirect', cat: '3xx', desc: 'Redirect, metode tetap.' },
    { code: 308, text: 'Permanent Redirect', cat: '3xx', desc: 'Redirect permanen, metode tetap.' },
    { code: 400, text: 'Bad Request', cat: '4xx', desc: 'Sintaks request salah.' },
    { code: 401, text: 'Unauthorized', cat: '4xx', desc: 'Butuh autentikasi.' },
    { code: 403, text: 'Forbidden', cat: '4xx', desc: 'Tidak punya akses.' },
    { code: 404, text: 'Not Found', cat: '4xx', desc: 'Resource tidak ada.' },
    { code: 405, text: 'Method Not Allowed', cat: '4xx', desc: 'Metode HTTP tidak diizinkan.' },
    { code: 408, text: 'Request Timeout', cat: '4xx', desc: 'Timeout klien.' },
    { code: 409, text: 'Conflict', cat: '4xx', desc: 'Konflik state.' },
    { code: 418, text: "I'm a teapot", cat: '4xx', desc: 'Easter egg RFC 2324.' },
    { code: 422, text: 'Unprocessable Entity', cat: '4xx', desc: 'Validasi gagal.' },
    { code: 429, text: 'Too Many Requests', cat: '4xx', desc: 'Rate limit tercapai.' },
    { code: 500, text: 'Internal Server Error', cat: '5xx', desc: 'Error server generik.' },
    { code: 501, text: 'Not Implemented', cat: '5xx', desc: 'Fitur belum ada.' },
    { code: 502, text: 'Bad Gateway', cat: '5xx', desc: 'Upstream invalid.' },
    { code: 503, text: 'Service Unavailable', cat: '5xx', desc: 'Server overload/maintenance.' },
    { code: 504, text: 'Gateway Timeout', cat: '5xx', desc: 'Upstream timeout.' },
  ];

  filtered = computed<StatusRow[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.statuses;
    return this.statuses.filter((s) =>
      String(s.code).includes(q) || s.text.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q),
    );
  });

  catClass(c: StatusRow['cat']): string {
    return 'hs-badge hs-' + c.charAt(0);
  }
}