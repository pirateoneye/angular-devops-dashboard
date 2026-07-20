import { Component, inject, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import {
  MCB_TOOLS_FILE_SERVER_MANAGER_DELETE_FILE,
  MCB_TOOLS_FILE_SERVER_MANAGER_DOWNLOAD_FILE,
  MCB_TOOLS_FILE_SERVER_MANAGER_LIST_CATEGORY_FILE,
  MCB_TOOLS_FILE_SERVER_MANAGER_LIST_FILE_BY_CATEGORY,
  MCB_TOOLS_FILE_SERVER_MANAGER_WRITE_FILE,
} from 'src/app/core/constant/api.constant';
import { ModalConfirmationComponent } from 'src/app/shared/component/modal/confirmation/modal-confirmation.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { InputFileUploadComponent } from '../../../shared/component/form/input-file-upload/input-file-upload.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule, MatIconModule,
    InputFileUploadComponent,
  ],
  selector: 'app-file-server-manager',
  templateUrl: './file-server-manager.component.html',
  styleUrls: ['./file-server-manager.component.css'],
})
export class FileServerManagerComponent implements OnInit {
  submissionManagementType: string = 'check';
  listCategory: any[] = [];
  category: any;
  response: any = {
    status: null,
    data: null,
    message: null,
    progress: 0,
  };

  readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  private readonly httpClient = inject(HttpClient);

  ngOnInit(): void {
    this.getListCategory();
  }

  getListCategory() {
    this.response.status = 'ON_PROCESS';
    this.response.message = 'Loading Category';
    this.response.data = null;
    this.httpClient
      .get(MCB_TOOLS_FILE_SERVER_MANAGER_LIST_CATEGORY_FILE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.response.status = 'SUCCESS';
          this.response.message = 'Get Category is Success';
          this.listCategory = response.output_schema;
          this.category = this.listCategory[0];
        },
        error: (error) => {
          console.error('error hit service: ', error);
          this.response.status = 'ERROR';
          this.response.message = `Get Category is Error with error: ${error.message ? error.message : error.error_schema.error_message.english}`;
        },
      });
  }

  onClickCheckButton(category?: string) {
    this.response.status = 'ON_PROCESS';
    this.response.message = `Loading List File By Category ${this.category.category}`;
    this.response.data = null;
    const cat = category ? category : this.category.category;
    const url = MCB_TOOLS_FILE_SERVER_MANAGER_LIST_FILE_BY_CATEGORY.replace(
      '{category}',
      cat,
    );
    this.httpClient
      .get(url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.response.status = 'SUCCESS';
          this.response.message = 'Get List File is Success';
          this.response.data = {
            listFile: response.output_schema,
            category: JSON.parse(JSON.stringify(this.category)),
          };
        },
        error: (error) => {
          console.error('error hit service: ', error);
          this.response.status = 'ERROR';
          this.response.message = `Get List File is Error with error: ${error.message ? error.message : error.error_schema.error_message.english}`;
          this.response.data = error.output_schema;
        },
      });
  }

  downloadFile(filename: string) {
    const url = MCB_TOOLS_FILE_SERVER_MANAGER_DOWNLOAD_FILE.replace(
      '{category}',
      this.response.data.category.category,
    ).replace('{filename}', filename);
    window.open(url, '_blank');
  }

  deleteFile(filename: string) {
    const dialogConfig = {
      width: '500px',
      data: {
        title: `Delete Data`,
        message: `Apakah anda ingin menghapus file <b> ${filename} </b>?`,
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
          const user: any = localStorage.getItem('msv-user');
          const category = this.response.data.category.category;
          const url = MCB_TOOLS_FILE_SERVER_MANAGER_DELETE_FILE.replace(
            '{category}',
            category,
          )
            .replace('{filename}', filename)
            .replace('{user}', user);
          this.response.status = 'ON_PROCESS';
          this.response.message = `Deleting File ${filename}`;
          this.response.data = null;
          this.httpClient
            .delete(url)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (_response: any) => {
                this.response.status = 'SUCCESS';
                this.response.message = `Deleting File ${filename} is Success`;
                this.onClickCheckButton(category);
              },
              error: (error) => {
                console.error('error hit service: ', error);
                this.response.status = 'ERROR';
                this.response.message = `Deleting File ${filename} is Error with error: ${error.message ? error.message : error.error_schema.error_message.english}`;
                this.response.data = null;
              },
            });
        },
      });
  }

  uploadFile(file: File) {
    const dialogConfig = {
      width: '500px',
      data: {
        title: `Upload Data`,
        message: `Apakah anda ingin mengupload file <b> ${file.name} </b>?`,
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

          const formData = new FormData();
          formData.append('file', file);
          const user: any = localStorage.getItem('msv-user');
          const category = this.response.data.category.category;
          const url = MCB_TOOLS_FILE_SERVER_MANAGER_WRITE_FILE.replace(
            '{category}',
            category,
          ).replace('{user}', user);
          this.response.status = 'ON_PROCESS';
          this.response.message = `Uploading File ${file.name}`;
          this.response.data = null;
          this.httpClient
            .post(url, formData, { reportProgress: true, observe: 'events' })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (event: HttpEvent<any>) => {
                if (event.type === HttpEventType.UploadProgress) {
                  if (event.total) {
                    this.response.progress = Math.round(
                      (event.loaded / event.total) * 100,
                    );
                  }
                } else if (event.type === HttpEventType.Response) {
                  this.response.progress = 0;
                  this.response.status = 'SUCCESS';
                  this.response.message = `Uploading File ${file.name} is Success`;
                  this.onClickCheckButton(category);
                }
              },
              error: (error) => {
                console.error(error);
                this.response.status = 'ERROR';
                this.response.message = `Uploading File ${file.name} is Error with error: ${error.message ? error.message : error.error_schema.error_message.english}`;
                this.response.data = null;
                this.response.progress = 0;
              },
            });
        },
      });
  }
}
