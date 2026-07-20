import { Component, inject, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { MCB_TOOLS_DATA_MANAGEMENT_GET_DATA } from 'src/app/core/constant/api.constant';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { SelectOption } from 'src/app/shared/components/msv-forms/interfaces';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MsvSelectComponent } from '../../../shared/components/msv-forms/msv-select/msv-select.component';
import { MsvResponsePanelComponent } from '../../../shared/components/msv-forms/msv-response-panel/msv-response-panel.component';
import { MsvButtonComponent } from '../../../shared/components/msv-forms/msv-button/msv-button.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule, MatIconModule,
    MsvSelectComponent, MsvResponsePanelComponent, MsvButtonComponent,
  ],
  selector: 'app-check-data',
  templateUrl: './check-data.component.html',
  styleUrls: ['./check-data.component.css'],
})
export class CheckDataComponent implements OnInit {
  submissionType: string = 'outlet-messi';
  checkBy: string = 'mid';
  checkValue: string = '';
  prefix: string = '';
  isCheckValuePristine: boolean = true;
  response: any = {
    submissionType: null,
    checkBy: null,
    checkValue: null,
    status: null,
    data: null,
    message: null,
  };

  submissionTypeOptions: SelectOption[] = [
    { label: 'Kelola Toko', value: 'kelola-toko' },
    { label: 'Merchant baru', value: 'merchant-baru' },
    { label: 'RIPLAY', value: 'riplay' },
    { label: 'Outlet Messi', value: 'outlet-messi' },
  ];

  placeholder: any = {
    'outlet-messi': 'Outlet Messi',
    riplay: 'RIPLAY',
    'no-referensi': 'No. Referensi',
    mid: 'MID',
    'no-kartu': 'No. kartu',
    'merchant-baru': 'Merchant Baru',
    'kelola-toko': 'Kelola Toko',
    email: 'Email',
  };

  option: any = {
    'merchant-baru': {
      prefix: 'pengajuan',
      checkBy: ['no-referensi', 'no-kartu'],
    },
    'kelola-toko': {
      prefix: 'pengajuan',
      checkBy: ['no-referensi', 'mid'],
    },
    riplay: {
      prefix: 'pengajuan',
      checkBy: ['email'],
    },
    'outlet-messi': {
      prefix: 'merchant',
      checkBy: ['mid'],
    },
  };

  readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  private readonly httpClient = inject(HttpClient);

  ngOnInit(): void {
    this.checkBy = this.option[this.submissionType].checkBy[0];
    this.prefix = this.option[this.submissionType].prefix;
    this.checkValue = '';
  }

  onChangeSubmissionType() {
    this.checkBy = this.option[this.submissionType].checkBy[0];
    this.prefix = this.option[this.submissionType].prefix;
    this.checkValue = '';
  }

  onClickCheckButton() {
    if (this.checkValue == '') {
      this.isCheckValuePristine = false;
      return;
    }

    this.response.status = 'ON_PROCESS';
    this.response.submissionType = this.submissionType;
    this.response.checkBy = this.checkBy;
    this.response.checkValue = this.checkValue;
    const url = `${MCB_TOOLS_DATA_MANAGEMENT_GET_DATA}`.replace('{prefix}', this.prefix).replace('{submissionType}', this.submissionType).replace('{checkBy}', this.checkBy).replace('{checkValue}', this.checkValue);
    this.httpClient
      .get(url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.response.status = 'SUCCESS';
          this.response.message = response.error_schema.error_message.english;
          this.response.data = response.output_schema;
        },
        error: (error) => {
          console.error('error hit service: ', error);
          this.response.status = 'ERROR';
          this.response.message = error.message
            ? error.message
            : error.error_schema.error_message.english;
          this.response.data = error.output_schema;
        },
      });
  }
}
