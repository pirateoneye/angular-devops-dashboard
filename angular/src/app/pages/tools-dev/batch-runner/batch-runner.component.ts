import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { BatchList } from 'src/app/shared/model/interface/batchlist.interface';
import { environment } from 'src/environments/environment';
import { StatusAPI } from 'src/app/shared/model/enum/status-api.enum';
import { DatePipe } from '@angular/common';
import { NgZone } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { ModalInsertNameComponent } from '../../../shared/component/modal/insert-name/modal-insert-name.component';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../../shared/service/user-service/user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../module/material.module';
import { ErrorStateComponent } from '../../../shared/component/error-state/error-state.component';
import { MsvFormsModule } from '../../../shared/components/msv-forms/msv-forms.module';

@Component({
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, MaterialModule,
    MsvFormsModule, ErrorStateComponent,
  ],
  selector: 'msv-batch-runner',
  templateUrl: './batch-runner.component.html',
  styleUrls: ['./batch-runner.component.css'],
})
export class BatchRunnerComponent implements OnInit {
  statusAPI = StatusAPI;
  batchList: BatchList[] = [];
  statusMenu: StatusAPI = StatusAPI.LOADING;
  currentProcessing = 0;
  user: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  statusBackground = {
    IDLE: 'idle-background',
    LOADING: 'on-process-background',
    SUCCESS: 'success-background',
    FAILED: 'failed-background',
  };

  statusBadge = {
    AVAILABLE: 'available-badge',
    'ON-PROGRESS': 'on-progress-badge',
  };

  constructor(
    private httpClient: HttpClient,
    private datePipe: DatePipe,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.getData();

    const userLocalStorage = localStorage.getItem('user');
    if (userLocalStorage) {
      this.userService.setNama(userLocalStorage);
      this.user = this.userService.getNama();
    } else {
      this.user = '-';
      this.editUsername();
    }

    this.userService.user.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => {
        this.user = user;
      },
    });
  }

  getFormattedTime(date: string) {
    if (!date) return '-';

    const dates = new Date(date);
    return this.datePipe.transform(dates, 'dd-MM-yyyy HH:mm:ss');
  }

  runBatch(id: number) {
    this.currentProcessing = id;

    const url = environment.hostBatchRunner + '/v1.0.0/batch/runner/' + id;
    const body = {
      runBy: this.user,
    };

    this.httpClient
      .post(url, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (_response) => {
          // handle response
        },
        error: (error) => {
          console.error(error);
        },
        complete: () => {
          setTimeout(() => {
            this.getData();
            this.currentProcessing = 0;
          }, 2000);
        },
      });
  }

  editUsername() {
    this.dialog.open(ModalInsertNameComponent, {
      disableClose: true,
      panelClass: 'custom-modalbox',
    });
  }

  getData(): void {
    this.ngZone.run(() => {
      const url = environment.hostBatchRunner + '/v1.0.0/batch/list';
      const option: any = { observe: 'response' };
      this.httpClient
        .get(url, option)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response: any) => {
            if (response.body.error_schema.error_code != 'MSV-200-001') {
              this.statusMenu = StatusAPI.FAILED;
              return;
            }
            this.statusMenu = StatusAPI.SUCCESS;
            this.batchList = response.body.output_schema;
            this.cdr.detectChanges();
            return;
          },
        });
    });
  }
}
