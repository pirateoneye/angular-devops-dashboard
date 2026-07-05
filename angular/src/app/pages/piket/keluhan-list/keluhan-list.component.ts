import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StatusAPI } from 'src/app/shared/model/enum/status-api.enum';
import { KeluhanList } from 'src/app/shared/model/interface/keluhanlist.interface';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../module/material.module';
import { MsvFormsModule } from '../../../shared/components/msv-forms/msv-forms.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { QuickHandleComponent } from '../../../shared/component/quick-handle/quick-handle.component';

/** KeluhanList row augmented with a precomputed due-soon flag for the template. */
type KeluhanListRow = KeluhanList & { dueSoon: boolean };

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MaterialModule,
    MsvFormsModule,
    MatSlideToggleModule,
    InfiniteScrollDirective,
    QuickHandleComponent,
  ],
  selector: 'app-keluhan-list',
  templateUrl: './keluhan-list.component.html',
  styleUrls: ['./keluhan-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeluhanListComponent implements OnInit {
  statusMenu = signal<StatusAPI>(StatusAPI.LOADING);
  statusList = signal<StatusAPI>(StatusAPI.LOADING);
  statusAPI = StatusAPI;
  totalRows = signal<number>(0);
  hitDate = signal<Date>(new Date());
  errorMessage = signal<string | null>(null);

  keluhanList = signal<KeluhanListRow[]>([]);
  size = 10;
  page = 1;
  filterStatus = 'Assigned';

  private readonly destroyRef = inject(DestroyRef);

  constructor(private httpClient: HttpClient) {}

  ngOnInit(): void {
    this.getData();
  }

  private toDayKey(d: Date): string {
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }

  /** Whether a row's batch due-date badge should show (precomputed once per row at load time). */
  private isBatchDueSoon(keluhan: KeluhanList): boolean {
    return (
      this.toDayKey(new Date(keluhan.duedate)) == this.toDayKey(new Date()) &&
      keluhan.status.toLowerCase() == 'assigned'
    );
  }

  getData(): void {
    // TODO: centralize this MerchantCare complaints endpoint in api.constant.ts (no matching constant exists yet).
    let url = `https://apo.com/api.merchantcare/1.1/complaints?page=${this.page}&size=${this.size}&orderby=entrydate%20desc&query=idcasecategory;equals;685`;
    if (this.filterStatus != 'ALL') {
      url = `${url};;status;equals;${this.filterStatus}`;
    }
    const option: any = {
      headers: new HttpHeaders({
        'Referrer-Policy': 'unsafe-url',
      }),
      observe: 'response',
    };
    this.httpClient
      .get(url, option)
      // auto-unsubscribes when this component is destroyed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          if (response.status != 200) {
            this.statusMenu.set(StatusAPI.FAILED);
            this.statusList.set(StatusAPI.FAILED);
            this.errorMessage.set(
              `Gagal memuat list keluhan (HTTP ${response.status}).`,
            );
            return;
          }
          const newRows: KeluhanListRow[] = (
            response.body.content as KeluhanList[]
          ).map((keluhan) => ({
            ...keluhan,
            dueSoon: this.isBatchDueSoon(keluhan),
          }));
          this.keluhanList.update((list) => list.concat(newRows));
          if (this.page == 1) {
            this.hitDate.set(new Date());
            this.totalRows.set(response.body.totalrows);
          }
          const listRequestId = newRows.map(
            (keluhan: KeluhanList) => keluhan.requestid,
          );
          this.getHandledRequestId(listRequestId);

          this.statusList.set(StatusAPI.SUCCESS);
          this.statusMenu.set(StatusAPI.SUCCESS);
          this.errorMessage.set(null);
        },
        error: (err: any) => {
          this.statusMenu.set(StatusAPI.FAILED);
          this.statusList.set(StatusAPI.FAILED);
          this.errorMessage.set(
            `Gagal memuat list keluhan. ${err?.message ?? ''}`.trim(),
          );
        },
      });
  }

  getHandledRequestId(requestId: string[]) {
    // TODO: centralize this audittrail endpoint in api.constant.ts (no matching constant exists yet).
    const url = `https://api-tools.apps.ocpdevgra.dti.co.id/v1.0.0/audittrail/piket`;
    const params = new HttpParams({ fromObject: { requestId } });
    const option: any = { observe: 'response', params: params };
    this.httpClient
      .get(url, option)
      // auto-unsubscribes when this component is destroyed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          if (response.status != 200) {
            return;
          }
          let changed = false;
          const list = this.keluhanList();
          list.forEach((keluhan) => {
            const resBody = response.body.output_schema[keluhan.requestid];
            if (
              resBody != null &&
              resBody.handled_by != null &&
              resBody.handled_method != null
            ) {
              keluhan.handled = {
                method: resBody.handled_method,
                name: resBody.handled_by,
                date: resBody.handled_date,
                notes: resBody.handled_notes,
                isNeedFu: resBody.is_need_fu,
              };
              changed = true;
            }
          });
          // Notify OnPush subscribers of the in-place handled-flag mutation.
          if (changed) {
            this.keluhanList.set([...list]);
          }
        },
        error: (err: any) => {
          // Supplementary data; do not fail the whole list, only surface a soft error.
          this.errorMessage.set(
            `Gagal memuat informasi penanganan. ${err?.message ?? ''}`.trim(),
          );
        },
      });
  }

  onScroll(_event: any): void {
    if (this.statusList() != StatusAPI.LOADING) {
      this.statusList.set(StatusAPI.LOADING);
      this.page++;
      this.getData();
    }
  }

  onChangeSelectFilterStatus() {
    this.statusMenu.set(StatusAPI.LOADING);
    this.statusList.set(StatusAPI.LOADING);
    this.totalRows.set(0);
    this.page = 1;
    this.keluhanList.set([]);
    this.errorMessage.set(null);
    this.getData();
  }
}
