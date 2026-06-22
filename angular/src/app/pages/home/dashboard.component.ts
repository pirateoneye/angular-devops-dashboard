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
  queryParams?: { t: string };
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
    { label: 'Utilities', description: '27 tools: JSON, decoder, regex, UUID, hash, password, diff, color, transforms, base, URL, chmod, line-tools, random, word-freq & more', icon: 'build', route: '/utilities', group: 'utility' },
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
