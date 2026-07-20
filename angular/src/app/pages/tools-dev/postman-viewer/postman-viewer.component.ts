import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClipboardService } from '../../../shared/service/clipboard/clipboard.service';

/* ========== Postman v2.1 Types ========== */

interface PostmanItem {
  name: string;
  item?: PostmanItem[];
  request?: PostmanRequest;
  description?: string;
}

interface PostmanRequest {
  method: string;
  url: PostmanUrl | string;
  header: PostmanHeader[];
  body?: PostmanBody;
  auth?: PostmanAuth;
  description?: string;
}

interface PostmanUrl {
  raw: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  port?: string;
  query?: PostmanQuery[];
  variable?: PostmanVariable[];
}

interface PostmanHeader { key: string; value: string; disabled?: boolean; description?: string; }
interface PostmanQuery { key: string; value: string; disabled?: boolean; description?: string; }
interface PostmanVariable { key: string; value: string; description?: string; }

interface PostmanBody {
  mode: string;
  raw?: string;
  urlencoded?: { key: string; value: string; disabled?: boolean; description?: string }[];
  formdata?: { key: string; value: string; type: string; disabled?: boolean; description?: string }[];
}

interface PostmanAuth {
  type: string;
  bearer?: { key: string; value: string }[];
  basic?: { key: string; value: string }[];
  apikey?: { key: string; value: string }[];
}

interface PostmanCollection {
  info: { name: string; schema: string; description?: string };
  item: PostmanItem[];
  variable?: PostmanVariable[];
}

/* ========== App types ========== */

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'request';
  description?: string;
  children?: TreeNode[];
  method?: string;
  url?: string;
  rawRequest?: PostmanRequest;
  parentPath?: string;
}

interface SavedCollection {
  id: string;
  name: string;
  description: string;
  requestCount: number;
  folderCount: number;
  variableCount: number;
  json: string;
  savedAt: string;
}


interface MasterEntry {
  id: string;
  file: string;
  name: string;
  description: string;
  category?: string;
}
const LS_KEY = 'msv-postman-library';
const LS_SELECTED = 'msv-postman-active-collection';

/* ========== Component ========== */

@Component({
  selector: 'app-postman-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule],
  templateUrl: './postman-viewer.component.html',
  styleUrls: ['./postman-viewer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostmanViewerComponent implements OnInit {
  private readonly clipboardSvc = inject(ClipboardService);
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  /* ---- Library mode ---- */
  readonly savedCollections = signal<SavedCollection[]>([]);
  readonly masterCollections = signal<MasterEntry[]>([]);
  readonly masterData = signal<Map<string, string>>(new Map());
  readonly libraryView = signal(true);
  readonly importText = signal('');
  readonly importError = signal('');
  readonly importing = signal(false);

  /* ---- Viewer mode ---- */
  readonly collectionName = signal('');
  readonly collectionDescription = signal('');
  readonly collectionVariables = signal<PostmanVariable[]>([]);
  readonly tree = signal<TreeNode[]>([]);
  readonly selectedNode = signal<TreeNode | null>(null);
  readonly searchQuery = signal('');
  readonly expandedFolders = signal<Set<string>>(new Set());
  readonly activeCollectionId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const sel = this.activeCollectionId();
      if (sel) {
        try { localStorage.setItem(LS_SELECTED, sel); } catch { /* ignore */ }
      } else {
        try { localStorage.removeItem(LS_SELECTED); } catch { /* ignore */ }
      }
    });
  }

  ngOnInit(): void {
    this.loadLibrary();
    this.loadMasters();
    const prevId = this.readActive();
    if (prevId) {
      const col = this.savedCollections().find((c) => c.id === prevId);
      if (col) this.openCollection(col);
    }
  }

  /* ===================== LIBRARY OPERATIONS ===================== */

  private readActive(): string | null {
    try { return localStorage.getItem(LS_SELECTED); } catch { return null; }
  }

  loadLibrary(): void {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        this.savedCollections.set(JSON.parse(raw) as SavedCollection[]);
      }
    } catch { /* ignore */ }
  }

  private persistLibrary(): void {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.savedCollections()));
    } catch { /* ignore */ }
  }

  /** Load master collections from assets/postman/index.json — items committed in repo. */
  loadMasters(): void {
    this.http.get<MasterEntry[]>('assets/postman/index.json').subscribe({
      next: (entries) => {
        this.masterCollections.set(entries);
        for (const entry of entries) {
          this.http.get(`assets/postman/${entry.file}`, { responseType: 'text' }).subscribe({
            next: (json) => this.masterData.update((m) => { m.set(entry.id, json); return m; }),
          });
        }
      },
      error: () => { /* no masters — fine */ },
    });
  }

  /** Open a master collection from the repo. */
  openMaster(event: Event, entry: MasterEntry): void {
    event.preventDefault();
    this.libraryView.set(false);
    this.activeCollectionId.set(entry.id);
    const json = this.masterData().get(entry.id);
    if (!json) {
      this.snackBar.open('File collection belum termuat — coba lagi', 'Dismiss', { duration: 2000 });
      return;
    }
    this.parseAndShow(json);
  }

  /** Parse JSON + populate viewer signals. */
  private parseAndShow(json: string): void {
    try {
      const data = JSON.parse(json) as PostmanCollection;
      this.collectionName.set(data.info.name);
      this.collectionDescription.set(data.info.description ?? '');
      this.collectionVariables.set(data.variable ?? []);
      this.tree.set(this.buildTree(data.item, ''));
      this.selectedNode.set(null);
      this.expandedFolders.set(new Set());
      this.searchQuery.set('');
    } catch {
      this.snackBar.open('Gagal parse JSON collection', 'Dismiss', { duration: 3000 });
    }
  }

  importCollection(): void {
    const text = this.importText().trim();
    if (!text) {
      this.importError.set('Paste JSON collection dulu.');
      return;
    }
    this.importing.set(true);
    this.importError.set('');
    try {
      const data = JSON.parse(text) as PostmanCollection;
      if (!data.info?.name || !Array.isArray(data.item)) {
        this.importError.set('Bukan Postman collection v2.1 yang valid.');
        return;
      }

      const id = this.sanitizeId(data.info.name) + '-' + Date.now();
      const existing = this.savedCollections().find((c) => c.id === id);
      if (existing) {
        this.importError.set(`Collection "${data.info.name}" sudah ada. Gunakan nama berbeda.`);
        return;
      }

      const flat = this.flattenStats(data.item);
      const entry: SavedCollection = {
        id,
        name: data.info.name,
        description: data.info.description ?? '',
        requestCount: flat.requests,
        folderCount: flat.folders,
        variableCount: (data.variable ?? []).length,
        json: JSON.stringify(data),
        savedAt: new Date().toISOString(),
      };

      this.savedCollections.update((arr) => [...arr, entry]);
      this.persistLibrary();
      this.importText.set('');
      this.snackBar.open(`"${data.info.name}" ditambahkan ke library`, 'Dismiss', { duration: 2500 });
    } catch (e) {
      this.importError.set('JSON tidak valid: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      this.importing.set(false);
    }
  }

  private sanitizeId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  }

  private flattenStats(items: PostmanItem[]): { requests: number; folders: number } {
    let requests = 0;
    let folders = 0;
    const walk = (arr: PostmanItem[]) => {
      for (const it of arr) {
        if (it.request) requests++;
        if (it.item) { folders++; walk(it.item); }
      }
    };
    walk(items);
    return { requests, folders };
  }

  deleteCollection(event: Event, col: SavedCollection): void {
    event.stopPropagation();
    this.savedCollections.update((arr) => arr.filter((c) => c.id !== col.id));
    this.persistLibrary();
    if (this.activeCollectionId() === col.id) {
      this.backToLibrary();
    }
    this.snackBar.open(`"${col.name}" dihapus`, 'Dismiss', { duration: 2000 });
  }

  downloadCollection(event: Event, col: SavedCollection): void {
    event.stopPropagation();
    const blob = new Blob([col.json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.sanitizeId(col.name)}.postman_collection.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.snackBar.open(`"${col.name}" di-download`, 'Dismiss', { duration: 1500 });
  }

  /** Download a master collection .json straight from assets. */
  downloadMaster(event: Event, entry: MasterEntry): void {
    event.stopPropagation();
    const a = document.createElement('a');
    a.href = `assets/postman/${entry.file}`;
    a.download = `${this.sanitizeId(entry.name)}.postman_collection.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.snackBar.open(`"${entry.name}" di-download`, 'Dismiss', { duration: 1500 });
  }

  /* ===================== VIEWER MODE ===================== */

  openCollection(col: SavedCollection): void {
    this.libraryView.set(false);
    this.activeCollectionId.set(col.id);
    this.parseAndShow(col.json);
  }

  backToLibrary(): void {
    this.libraryView.set(true);
    this.activeCollectionId.set(null);
    this.tree.set([]);
    this.collectionName.set('');
    this.collectionDescription.set('');
    this.collectionVariables.set([]);
    this.selectedNode.set(null);
    this.expandedFolders.set(new Set());
  }

  downloadActive(): void {
    const col = this.savedCollections().find((c) => c.id === this.activeCollectionId());
    if (!col) return;
    this.downloadCollection(new Event('click') as any, col);
  }

  private buildTree(items: PostmanItem[], parentPath: string): TreeNode[] {
    return items.map((item, idx): TreeNode => {
      const id = parentPath ? `${parentPath}/${idx}` : `${idx}`;
      const isFolder = !item.request && Array.isArray(item.item);
      if (isFolder) {
        return {
          id, name: item.name, type: 'folder', description: item.description,
          children: this.buildTree(item.item ?? [], id), parentPath,
        };
      }
      const req = item.request!;
      const urlStr = typeof req.url === 'string' ? req.url : req.url?.raw ?? '';
      return {
        id, name: item.name, type: 'request', method: req.method, url: urlStr,
        description: req.description ?? item.description, rawRequest: req, parentPath,
      };
    });
  }

  /* ---- computed ---- */

  readonly allRequests = computed<TreeNode[]>(() => {
    const out: TreeNode[] = [];
    const walk = (nodes: TreeNode[]) => {
      for (const n of nodes) { if (n.type === 'request') out.push(n); if (n.children) walk(n.children); }
    };
    walk(this.tree());
    return out;
  });

  readonly filteredTree = computed<TreeNode[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.tree();
    return this.filterTree(this.tree(), q);
  });

  private filterTree(nodes: TreeNode[], q: string): TreeNode[] {
    const out: TreeNode[] = [];
    for (const n of nodes) {
      if (n.type === 'request') {
        const match = n.name.toLowerCase().includes(q) || (n.url ?? '').toLowerCase().includes(q)
          || (n.method ?? '').toLowerCase().includes(q) || (n.description ?? '').toLowerCase().includes(q);
        if (match) out.push(n);
      } else if (n.children) {
        const filtered = this.filterTree(n.children, q);
        if (filtered.length) out.push({ ...n, children: filtered });
      }
    }
    return out;
  }

  readonly requestCount = computed(() => this.allRequests().length);
  readonly folderCount = computed(() => {
    let n = 0; const walk = (nodes: TreeNode[]) => {
      for (const node of nodes) { if (node.type === 'folder') { n++; if (node.children) walk(node.children); } }
    }; walk(this.tree()); return n;
  });

  extractUrlVariables(url: string | undefined): string[] {
    if (!url) return [];
    const out: string[] = []; const re = /\{\{([^}]+)\}\}/g; let m;
    while ((m = re.exec(url)) !== null) out.push(m[1]);
    return out;
  }

  resolveVariable(key: string): string {
    return this.collectionVariables().find((x) => x.key === key)?.value ?? `<${key}>`;
  }

  sampleJson(): string {
    const sample: PostmanCollection = {
      info: { name: 'MSV Sample API', description: 'Contoh collection untuk dokumentasi API MSV Tools.', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
      variable: [{ key: 'baseUrl', value: 'https://api.msv-tools.local' }, { key: 'apiVersion', value: 'v1' }],
      item: [
        { name: 'Auth', description: 'Authentication endpoints', item: [
          { name: 'Login', request: { method: 'POST', url: { raw: '{{baseUrl}}/{{apiVersion}}/auth/login', host: ['{{baseUrl}}', '{{apiVersion}}', 'auth', 'login'] }, header: [{ key: 'Content-Type', value: 'application/json' }], body: { mode: 'raw', raw: '{"username":"admin","password":"secret"}' }, description: 'Login dengan username + password, dapatkan access token.' } },
          { name: 'Refresh Token', request: { method: 'POST', url: { raw: '{{baseUrl}}/{{apiVersion}}/auth/refresh', host: ['{{baseUrl}}', '{{apiVersion}}', 'auth', 'refresh'] }, header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }], description: 'Perpanjang session dengan refresh token.' } },
        ] },
        { name: 'Users', description: 'User management endpoints', item: [
          { name: 'List Users', request: { method: 'GET', url: { raw: '{{baseUrl}}/{{apiVersion}}/users?page=1&size=20', host: ['{{baseUrl}}', '{{apiVersion}}', 'users'], query: [{ key: 'page', value: '1', description: 'Page number (1-based)' }, { key: 'size', value: '20', description: 'Items per page' }] }, header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }], description: 'List semua user dengan pagination. Wajib pakai access token.' } },
          { name: 'Get User by ID', request: { method: 'GET', url: { raw: '{{baseUrl}}/{{apiVersion}}/users/:id', host: ['{{baseUrl}}', '{{apiVersion}}', 'users', ':id'], variable: [{ key: 'id', value: '1', description: 'User ID' }] }, header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }], description: 'Detail satu user berdasarkan ID.' } },
          { name: 'Create User', request: { method: 'POST', url: { raw: '{{baseUrl}}/{{apiVersion}}/users', host: ['{{baseUrl}}', '{{apiVersion}}', 'users'] }, header: [{ key: 'Content-Type', value: 'application/json' }, { key: 'Authorization', value: 'Bearer {{accessToken}}' }], body: { mode: 'raw', raw: '{"name":"John Doe","email":"john@example.com","roles":["admin"]}' }, description: 'Buat user baru. Email harus unik.' } },
          { name: 'Delete User', request: { method: 'DELETE', url: { raw: '{{baseUrl}}/{{apiVersion}}/users/:id', host: ['{{baseUrl}}', '{{apiVersion}}', 'users', ':id'] }, header: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }], description: 'Hapus user. Tidak bisa di-undo.' } },
        ] },
      ],
    };
    return JSON.stringify(sample, null, 2);
  }

  resolvedUrl(node: TreeNode): string {
    if (!node.url) return '';
    let u = node.url;
    for (const v of this.extractUrlVariables(node.url)) u = u.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), this.resolveVariable(v));
    return u;
  }

  selectNode(node: TreeNode): void { this.selectedNode.set(node); }

  toggleFolder(id: string): void {
    this.expandedFolders.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  isExpanded(id: string): boolean { return this.expandedFolders().has(id); }

  queryParams(node: TreeNode): PostmanQuery[] {
    const u = node.rawRequest?.url;
    if (!u || typeof u === 'string') return [];
    return (u.query ?? []).filter((q) => !q.disabled);
  }

  headers(node: TreeNode): PostmanHeader[] {
    return (node.rawRequest?.header ?? []).filter((h) => !h.disabled);
  }

  bodyPreview(node: TreeNode): string {
    const b = node.rawRequest?.body;
    if (!b) return '';
    if (b.mode === 'raw' && b.raw) return b.raw;
    if (b.mode === 'urlencoded' && b.urlencoded) return b.urlencoded.filter((x) => !x.disabled).map((x) => `${x.key}=${x.value}`).join('\n');
    if (b.mode === 'formdata' && b.formdata) return b.formdata.filter((x) => !x.disabled).map((x) => `${x.key}=${x.value}`).join('\n');
    return '';
  }

  authSummary(node: TreeNode): string {
    const a = node.rawRequest?.auth;
    if (!a) return 'None';
    if (a.type === 'bearer') { const t = a.bearer?.find((x) => x.key === 'token')?.value ?? '<token>'; return `Bearer ${t.slice(0, 8)}…`; }
    if (a.type === 'basic') { const u = a.basic?.find((x) => x.key === 'username')?.value ?? ''; return `Basic ${u}:***`; }
    if (a.type === 'apikey') { const k = a.apikey?.find((x) => x.key === 'key')?.value ?? ''; const v = a.apikey?.find((x) => x.key === 'value')?.value ?? ''; return `ApiKey ${k}=${v.slice(0, 4)}…`; }
    return a.type;
  }

  copyUrl(node: TreeNode): void { if (node.url) void this.copyText(this.resolvedUrl(node)); }

  copyAsCurl(node: TreeNode): void {
    const req = node.rawRequest;
    if (!req) return;
    const parts = [`curl -X ${req.method} '${this.resolvedUrl(node)}'`];
    for (const h of this.headers(node)) parts.push(`  -H '${h.key}: ${h.value}'`);
    const body = this.bodyPreview(node);
    if (body) parts.push(`  -d '${body.replace(/'/g, "'\\''")}'`);
    void this.copyText(parts.join(' \\\n'));
  }

  private async copyText(text: string): Promise<void> {
    const ok = await this.clipboardSvc.copy(text);
    this.snackBar.open(ok ? 'Copied' : 'Copy gagal', 'Dismiss', { duration: 1500 });
  }
}