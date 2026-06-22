import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Component, HostListener, OnInit } from '@angular/core';
import { StatusAPI } from 'src/app/shared/model/enum/status-api.enum';
import { KeluhanList } from 'src/app/shared/model/interface/keluhanlist.interface';
import { UserService } from 'src/app/shared/service/user-service/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../module/material.module';
import { MsvFormsModule } from '../../../shared/components/msv-forms/msv-forms.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { QuickHandleComponent } from './component/quick-handle/quick-handle.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MaterialModule, MsvFormsModule, MatSlideToggleModule, InfiniteScrollModule, QuickHandleComponent],
  selector: 'app-keluhan-list',
  templateUrl: './keluhan-list.component.html',
  styleUrls: ['./keluhan-list.component.css']
})
export class KeluhanListComponent implements OnInit {
  statusMenu: StatusAPI = StatusAPI.LOADING;
  statusList: StatusAPI = StatusAPI.LOADING;
  statusAPI = StatusAPI;
  totalRows = 0;
  hitDate: Date = new Date();


  keluhanList: KeluhanList[] = [];
  size = 10;
  page = 1;
  filterStatus = "Assigned";
  // quickReplyTemplate = "CUSTOM";
  // quickReplyTemplateMap : any = {
  //   "PERBAIKAN_DATA_USER" : "Perbaikan data telah kami lakukan.\nMohon bantuannya untuk mencoba logout dan login kembali.",
  //   "CUSTOM" : ""
  // }
  // quickReplyContent = ""


  constructor(private httpClient: HttpClient,
    private userService: UserService,
    private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.getData();
  }

  getData(): void {
    let url = `http://apo.com/api.merchantcare/1.1/complaints?page=${this.page}&size=${this.size}&orderby=entrydate%20desc&query=idcasecategory;equals;685`;
    if (this.filterStatus != "ALL") {
      url = `${url};;status;equals;${this.filterStatus}`
    }
    let option: any = {
      headers : new HttpHeaders({
            'Referrer-Policy': 'unsafe-url'
          }),
      observe: "response"
    };
    this.httpClient.get(url, option).subscribe((response: any) => {
      if (response.status != 200) {
        this.statusMenu = StatusAPI.FAILED;
        return;
      }
      this.keluhanList = this.keluhanList.concat(response.body.content);
      if (this.page == 1) {
        this.hitDate = new Date();
        this.totalRows = response.body.totalrows;
      }
      let listRequestId = response.body.content.map((keluhan: any) => keluhan.requestid);
      this.getHandledRequestId(listRequestId)

      this.statusList = StatusAPI.SUCCESS;
      this.statusMenu = StatusAPI.SUCCESS;
    })
  }

  getHandledRequestId(requestId: string[]) {
    let url = `https://api-tools.apps.ocpdevgra.dti.co.id/v1.0.0/audittrail/piket`
    const params = new HttpParams({ fromObject: { requestId } });
    let option: any = { observe: "response", params: params };
    this.httpClient.get(url, option).subscribe((response: any) => {
      if (response.status != 200) {
        return;
      }
      this.keluhanList.forEach((keluhan) => {
        let resBody = response.body.output_schema[keluhan.requestid];
        if (resBody != null && resBody.handled_by != null && resBody.handled_method != null) {
          keluhan.handled = {
            method: resBody.handled_method,
            name: resBody.handled_by,
            date: resBody.handled_date,
            notes: resBody.handled_notes,
            isNeedFu: resBody.is_need_fu
          }
        }
      })
    })
  }


  onScroll(event: any): void {
    console.log("bottom of the page");
    if (this.statusList != StatusAPI.LOADING) {
      this.statusList = StatusAPI.LOADING;
      this.page++;
      console.log("Get Data ");
      this.getData();
    }
  }

  onChangeSelectFilterStatus() {
    this.statusMenu = StatusAPI.LOADING;
    this.totalRows = 0;
    this.page = 1;
    this.keluhanList = [];
    this.getData()
  }

  showBatchDueDate(keluhan: KeluhanList) {
    return new Date(keluhan.duedate).toLocaleDateString() == new Date().toLocaleDateString() && keluhan.status.toLowerCase() == 'assigned'
  }
  // onChangeSelectQuickReplyTemplate(){
  //   this.quickReplyContent = this.quickReplyTemplateMap[this.quickReplyTemplate];
  // }

}
