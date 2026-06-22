import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ModalConfirmationComponent } from 'src/app/shared/component/modal/confirmation/modal-confirmation.component';
import { SelectOption } from 'src/app/shared/components/msv-forms/interfaces';
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

  constructor(private httpClient: HttpClient) {}

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
    let url = `https://api-tools.apps.ocpdevgra.dti.co.id/v1.0.0/data/${this.prefix}/${this.submissionType}/${this.checkBy}/${this.checkValue}`;
    console.log(url);
    this.httpClient.get(url).subscribe(
      (response: any) => {
        console.log('success hit service: ', response);
        this.response.status = 'SUCCESS';
        this.response.message = response.error_schema.error_message.english;
        this.response.data = response.output_schema;
      },
      (error) => {
        console.error('error hit service: ', error);
        this.response.status = 'ERROR';
        this.response.message = error.message
          ? error.message
          : error.error_schema.error_message.english;
        this.response.data = error.output_schema;
      },
    );
  }
}
