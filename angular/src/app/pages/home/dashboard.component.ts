import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface ToolTile {
  label: string;
  description: string;
  icon: string;
  route: string;
  group: 'tools-dev' | 'utility' | 'piket';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {
  tiles: ToolTile[] = [
    { label: 'Batch Runner', description: 'Jalankan batch manual di UAT', icon: 'event_note', route: '/tools-dev/batch-runner', group: 'tools-dev' },
    { label: 'Crypto', description: 'Enkripsi / dekripsi / decode', icon: 'enhanced_encryption', route: '/tools-dev/crypto', group: 'tools-dev' },
    { label: 'Check Data', description: 'Cek data pengajuan', icon: 'search', route: '/tools-dev/check-data', group: 'tools-dev' },
    { label: 'Delete Data', description: 'Hapus data pengajuan', icon: 'delete', route: '/tools-dev/delete-data', group: 'tools-dev' },
    { label: 'File Server Manager', description: 'Kelola file server', icon: 'folder', route: '/tools-dev/file-server-manager', group: 'tools-dev' },
    { label: 'Push Notif FCM', description: 'Kirim push notification FCM', icon: 'notifications', route: '/tools-dev/push-notif-fcm', group: 'tools-dev' },
    { label: 'Publish Kafka', description: 'Publish message ke Kafka', icon: 'send', route: '/tools-dev/publish-kafka', group: 'tools-dev' },
    { label: 'GitLab Tags Monitor', description: 'Monitor tag GitLab', icon: 'label', route: '/tools-dev/gitlab/tags-monitor', group: 'tools-dev' },
    { label: 'GitLab Task', description: 'Task GitLab', icon: 'task', route: '/tools-dev/gitlab/task', group: 'tools-dev' },
    { label: 'GitLab Bulk', description: 'Operasi bulk GitLab', icon: 'batch_prediction', route: '/tools-dev/gitlab/bulk', group: 'tools-dev' },
    { label: 'Paimon Dupe', description: 'Cek duplikat Paimon', icon: 'content_copy', route: '/tools-dev/paimon-dupe', group: 'tools-dev' },
    { label: 'MSV Test', description: 'Sandbox komponen MSV', icon: 'science', route: '/tools-dev/msv-test', group: 'tools-dev' },
    { label: 'MSV Docs', description: 'Dokumentasi komponen MSV', icon: 'menu_book', route: '/tools-dev/msv-docs', group: 'tools-dev' },
    { label: 'JSON Formatter', description: 'Format & validasi JSON', icon: 'data_object', route: '/tools-dev/json-formatter', group: 'utility' },
    { label: 'Decoder', description: 'Base64 / URL / JWT decoder', icon: 'lock_open', route: '/tools-dev/decoder', group: 'utility' },
    { label: 'Regex Tester', description: 'Uji regex + capture groups', icon: 'rule', route: '/tools-dev/regex-tester', group: 'utility' },
    { label: 'ID Generator', description: 'UUID & timestamp generator', icon: 'fingerprint', route: '/tools-dev/id-generator', group: 'utility' },
    { label: 'Hash Generator', description: 'MD5/SHA hash teks', icon: 'fingerprint', route: '/tools-dev/hash-generator', group: 'utility' },
    { label: 'Password Generator', description: 'Password acak aman', icon: 'vpn_key', route: '/tools-dev/password-generator', group: 'utility' },
    { label: 'Text Diff', description: 'Bandingkan dua teks', icon: 'compare_arrows', route: '/tools-dev/text-diff', group: 'utility' },
    { label: 'Color Converter', description: 'HEX/RGB/HSL', icon: 'palette', route: '/tools-dev/color-converter', group: 'utility' },
    { label: 'Text Transforms', description: 'Case/sort/escape/counts', icon: 'transform', route: '/tools-dev/text-transforms', group: 'utility' },
    { label: 'Base Converter', description: 'Bin/Oct/Dec/Hex', icon: 'calculate', route: '/tools-dev/base-converter', group: 'utility' },
    { label: 'List Keluhan', description: 'Daftar keluhan piket', icon: 'list_alt', route: '/piket/keluhan-list', group: 'piket' },
    { label: 'Fix Data User', description: 'Perbaiki data user', icon: 'edit', route: '/piket/fix-data-user', group: 'piket' },
    { label: 'Fix After Merge CIS', description: 'Perbaikan pasca merge CIS', icon: 'merge_type', route: '/piket/fix-after-merge-cis', group: 'piket' },
    { label: 'Calendar Piket', description: 'Jadwal piket', icon: 'calendar_today', route: '/piket/calendar', group: 'piket' },
  ];

  groups: { key: ToolTile['group']; label: string }[] = [
    { key: 'tools-dev', label: 'Dev Tools' },
    { key: 'utility', label: 'Utilities' },
    { key: 'piket', label: 'Piket' },
  ];

  tilesFor(key: string): ToolTile[] {
    return this.tiles.filter((t) => t.group === key);
  }
}