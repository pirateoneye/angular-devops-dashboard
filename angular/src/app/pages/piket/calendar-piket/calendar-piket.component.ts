import {
  Component,
  ChangeDetectionStrategy,
  computed,
  signal,
} from '@angular/core';
import { StatusAPI } from 'src/app/shared/model/enum/status-api.enum';

interface ScheduleEntry {
  dateStr: string;
  pic1: string;
  pic2: string;
  pic3: string;
}

interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  schedule?: ScheduleEntry;
  isToday: boolean;
}
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatSlideToggleModule,
    InfiniteScrollDirective,
  ],
  selector: 'app-calendar-piket',
  templateUrl: './calendar-piket.component.html',
  styleUrls: ['./calendar-piket.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPiketComponent {
  statusMenu = signal<StatusAPI>(StatusAPI.IDLE);
  statusAPI = StatusAPI;

  readonly today = new Date();
  readonly currentMonth = signal(this.today.getMonth());
  readonly currentYear = signal(this.today.getFullYear());
  readonly scheduleMap = signal<Map<string, ScheduleEntry>>(new Map());
  readonly fileName = signal('');

  monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  readonly calendarDays = computed<CalendarDay[]>(() =>
    this.buildCalendar(
      this.currentMonth(),
      this.currentYear(),
      this.scheduleMap(),
    ),
  );

  private buildCalendar(
    month: number,
    year: number,
    scheduleMap: Map<string, ScheduleEntry>,
  ): CalendarDay[] {
    const days: CalendarDay[] = [];
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = this.formatDateStr(day, month, year);
      const isToday =
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

      days.push({
        day,
        isCurrentMonth: true,
        schedule: scheduleMap.get(dateStr),
        isToday,
      });
    }

    // Next month padding to fill 6 rows (42 cells)
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    return days;
  }

  formatDateStr(day: number, month: number, year: number): string {
    const d = day.toString().padStart(2, '0');
    const m = (month + 1).toString().padStart(2, '0');
    return `${d}-${m}-${year}`;
  }

  prevMonth(): void {
    const month = this.currentMonth() - 1;
    if (month < 0) {
      this.currentMonth.set(11);
      this.currentYear.update((y) => y - 1);
    } else {
      this.currentMonth.set(month);
    }
  }

  nextMonth(): void {
    const month = this.currentMonth() + 1;
    if (month > 11) {
      this.currentMonth.set(0);
      this.currentYear.update((y) => y + 1);
    } else {
      this.currentMonth.set(month);
    }
  }

  goToToday(): void {
    const today = new Date();
    this.currentMonth.set(today.getMonth());
    this.currentYear.set(today.getFullYear());
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.fileName.set(file.name);
    this.statusMenu.set(StatusAPI.LOADING);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        this.parseSchedule(content);
        this.statusMenu.set(StatusAPI.SUCCESS);
      } catch (err) {
        console.error('Error parsing file:', err);
        this.statusMenu.set(StatusAPI.FAILED);
      }
    };
    reader.onerror = () => {
      this.statusMenu.set(StatusAPI.FAILED);
    };
    reader.readAsText(file);
  }

  parseSchedule(content: string): void {
    const map = new Map<string, ScheduleEntry>();
    const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');

    // Skip header if first line contains non-date words
    let startIndex = 0;
    const firstLine = lines[0]?.trim().toUpperCase();
    if (
      firstLine &&
      (firstLine.includes('TANGGAL') ||
        firstLine.includes('DATE') ||
        firstLine.includes('PIC'))
    ) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 4) {
        const dateStr = parts[0];
        const entry: ScheduleEntry = {
          dateStr,
          pic1: parts[1] || '-',
          pic2: parts[2] || '-',
          pic3: parts[3] || '-',
        };
        map.set(dateStr, entry);

        // Also store with normalized format if input uses yyyy-mm-dd
        const normalized = this.normalizeDateStr(dateStr);
        if (normalized && normalized !== dateStr) {
          map.set(normalized, entry);
        }
      }
    }
    this.scheduleMap.set(map);
  }

  normalizeDateStr(dateStr: string): string | null {
    // Try to detect yyyy-mm-dd and convert to dd-mm-yyyy
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
    }
    return null;
  }
}
