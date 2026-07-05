import { HttpClient } from '@angular/common/http';
import { Component, inject, DestroyRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ModalConfirmationComponent } from 'src/app/shared/component/modal/confirmation/modal-confirmation.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../module/material.module';
import { MsvFormsModule } from '../../../shared/components/msv-forms/msv-forms.module';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MaterialModule,
    MsvFormsModule,
  ],
  selector: 'delete-data',
  templateUrl: './delete-data.component.html',
  styleUrls: ['./delete-data.component.css'],
})
export class DeleteDataComponent {
  submissionType: string = 'riplay';
  deleteBy: string = 'email';
  deleteValue: string = '';
  validationError: string | null = null;
  isLoading: boolean = false;
  response: any = {
    submissionType: null,
    deleteBy: null,
    deleteValue: null,
    status: null,
    message: null,
  };

  placeholder: any = {
    riplay: 'RIPLAY',
    'no-referensi': 'No. Referensi',
    mid: 'MID',
    'no-kartu': 'No. kartu',
    'merchant-baru': 'Merchant Baru',
    'kelola-toko': 'Kelola Toko',
    'no-rekening': 'No. Rekening',
    email: 'Email',
  };

  option: any = {
    'merchant-baru': ['no-referensi', 'no-rekening', 'no-kartu'],
    'kelola-toko': ['no-referensi', 'mid'],
    riplay: ['email'],
  };

  readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  constructor(private httpClient: HttpClient) {}

  onChangeSubmissionType() {
    this.deleteBy = this.option[this.submissionType][0];
    this.deleteValue = '';
    this.validationError = null;
  }

  onDeleteValueChange() {
    this.validationError = null;
  }

  onClickDeleteButton() {
    if (!this.deleteValue.trim()) {
      this.validationError = 'Target value is required.';
      return;
    }
    const dialogConfig = {
      width: '500px',
      data: {
        title: `Delete Data`,
        message:
          'Apakah anda ingin menghapus data <b>' +
          this.placeholder[this.submissionType] +
          '</b> dengan <b>' +
          this.placeholder[this.deleteBy] +
          ' ' +
          this.deleteValue +
          '</b>?',
      },
    };
    this.dialog
      .open(ModalConfirmationComponent, dialogConfig)
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (!res) {
            return;
          }
          this.isLoading = true;
          this.response.submissionType = this.submissionType;
          this.response.deleteBy = this.deleteBy;
          this.response.deleteValue = this.deleteValue;
          const user = localStorage.getItem('user');
          const url = `https://api-tools.apps.ocpdevgra.dti.co.id/v1.0.0/data/pengajuan/${this.submissionType}/${this.deleteBy}/${this.deleteValue}?audittrailUser=${user}`;
          this.httpClient
            .delete(url)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (response: any) => {
                this.isLoading = false;
                this.response.status = 'SUCCESS';
                this.response.message = response.error_message.english;
              },
              error: (error) => {
                this.isLoading = false;
                console.error('error hit service: ', error);
                this.response.status = 'ERROR';
                this.response.message = error.message
                  ? error.message
                  : error.error_message.english;
              },
            });
        },
      });
  }
}
