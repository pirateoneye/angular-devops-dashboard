import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ModalConfirmationComponent } from 'src/app/shared/component/modal/confirmation/modal-confirmation.component';
import { UserService } from 'src/app/shared/service/user-service/user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  selector: 'delete-data',
  templateUrl: './delete-data.component.html',
  styleUrls: ['./delete-data.component.css']
})
export class DeleteDataComponent {
  submissionType : string = "riplay";
  deleteBy : string = "email";
  deleteValue : string = "";
  isDeleteValuePristine : boolean = true;
  response : any = {
    submissionType : null,
    deleteBy : null,
    deleteValue : null,
    status : null,
    message : null
  }

  placeholder : any ={
    "riplay": "RIPLAY",
    "no-referensi" :"No. Referensi",
    "mid" :"MID",
    "no-kartu" :"No. kartu",
    "merchant-baru" :"Merchant Baru",
    "kelola-toko" :"Kelola Toko",
    "no-rekening" : "No. Rekening",
    "email" : "Email"
  }

  option : any = {
    "merchant-baru" : [
      "no-referensi",
      "no-rekening",
      "no-kartu"
    ],
    "kelola-toko" : [
      "no-referensi",
      "mid"
    ],
    "riplay" : [
      "email"
    ]
  }

  readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  constructor(private httpClient : HttpClient,
    private userService : UserService
  ){}

  onChangeSubmissionType(){
    this.deleteBy =  this.option[this.submissionType][0];
    this.deleteValue ="";
  }


  onClickDeleteButton(){
    if(this.deleteValue == "")
    {
      this.isDeleteValuePristine = false;
      return;
    }
    const dialogConfig = {width: '500px',
        data: {
          title: `Delete Data`,
          message : "Apakah anda ingin menghapus data <b>" + this.placeholder[this.submissionType] + "</b> dengan <b>" + this.placeholder[this.deleteBy] + " " + this.deleteValue + "</b>?"
        }
    };
    this.dialog.open(ModalConfirmationComponent, dialogConfig).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res) =>{
      if(!res)
      {
        return;
      }
      this.response.status = "ON_PROCESS";
      this.response.submissionType = this.submissionType;
      this.response.deleteBy = this.deleteBy;
      this.response.deleteValue = this.deleteValue;
      const user = localStorage.getItem('user');
      const url = `https://api-tools.apps.ocpdevgra.dti.co.id/v1.0.0/data/pengajuan/${this.submissionType}/${this.deleteBy}/${this.deleteValue}?audittrailUser=${user}`
      this.httpClient.delete(url).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((response : any) =>{
        this.response.status = "SUCCESS";
        this.response.message = response.error_message.english;
      }, (error) =>{
        console.error("error hit service: ", error)
        this.response.status = "ERROR";
        this.response.message = error.message ? error.message :  error.error_message.english;
      });
    })
  }

}
