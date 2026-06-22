import { Component, OnInit } from '@angular/core';
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
import { MaterialModule } from '../../../module/material.module';
import { MsvFormsModule } from '../../../shared/components/msv-forms/msv-forms.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MaterialModule, MsvFormsModule, MatSlideToggleModule, InfiniteScrollModule],
  selector: 'app-calendar-piket',
  templateUrl: './calendar-piket.component.html',
  styleUrls: ['./calendar-piket.component.css']
})
export class CalendarPiketComponent implements OnInit {
  statusMenu: StatusAPI = StatusAPI.IDLE;
  statusAPI = StatusAPI;

  currentDate = new Date();
  currentMonth = this.currentDate.getMonth();
  currentYear = this.currentDate.getFullYear();

  monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  calendarDays: CalendarDay[] = [];
  scheduleMap: Map<string, ScheduleEntry> = new Map();
  fileName = '';

  ngOnInit(): void {
    this.generateCalendar();
  }

  generateCalendar(): void {
    this.calendarDays = [];
    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    const lastDayOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();

    // Previous month padding
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      this.calendarDays.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = this.formatDateStr(day, this.currentMonth, this.currentYear);
      const isToday = day === today.getDate() &&
        this.currentMonth === today.getMonth() &&
        this.currentYear === today.getFullYear();

      this.calendarDays.push({
        day,
        isCurrentMonth: true,
        schedule: this.scheduleMap.get(dateStr),
        isToday
      });
    }

    // Next month padding to fill 6 rows (42 cells)
    const remainingCells = 42 - this.calendarDays.length;
    for (let day = 1; day <= remainingCells; day++) {
      this.calendarDays.push({
        day,
        isCurrentMonth: false,
        isToday: false
      });
    }
  }

  formatDateStr(day: number, month: number, year: number): string {
    const d = day.toString().padStart(2, '0');
    const m = (month + 1).toString().padStart(2, '0');
    return `${d}-${m}-${year}`;
  }

  prevMonth(): void {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
  }

  goToToday(): void {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.generateCalendar();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.fileName = file.name;
    this.statusMenu = StatusAPI.LOADING;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        this.parseSchedule(content);
        this.generateCalendar();
        this.statusMenu = StatusAPI.SUCCESS;
      } catch (err) {
        console.error('Error parsing file:', err);
        this.statusMenu = StatusAPI.FAILED;
      }
    };
    reader.onerror = () => {
      this.statusMenu = StatusAPI.FAILED;
    };
    reader.readAsText(file);
  }

  parseSchedule(content: string): void {
    this.scheduleMap.clear();
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

    // Skip header if first line contains non-date words
    let startIndex = 0;
    const firstLine = lines[0]?.trim().toUpperCase();
    if (firstLine && (firstLine.includes('TANGGAL') || firstLine.includes('DATE') || firstLine.includes('PIC'))) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length >= 4) {
        const dateStr = parts[0];
        const entry: ScheduleEntry = {
          dateStr,
          pic1: parts[1] || '-',
          pic2: parts[2] || '-',
          pic3: parts[3] || '-'
        };
        this.scheduleMap.set(dateStr, entry);

        // Also store with normalized format if input uses yyyy-mm-dd
        const normalized = this.normalizeDateStr(dateStr);
        if (normalized && normalized !== dateStr) {
          this.scheduleMap.set(normalized, entry);
        }
      }
    }
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
