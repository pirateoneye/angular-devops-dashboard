import { Component, Input } from '@angular/core';
import { KeluhanList } from 'src/app/shared/model/interface/keluhanlist.interface';
import { HttpClient } from '@angular/common/http';
import { StatusAPI } from 'src/app/shared/model/enum/status-api.enum';
import { UserService } from 'src/app/shared/service/user-service/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FixDataUserComponent } from '../../../fix-data-user/fix-data-user.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, FixDataUserComponent],
  selector: 'quick-handle',
  templateUrl: './quick-handle.component.html',
  styleUrls: ['./quick-handle.component.css']
})
export class QuickHandleComponent {

  @Input() keluhan : KeluhanList;
  quickHandleMethod = "PERBAIKAN_DATA_USER"
  quickHandleNotes = ""
  quickHandleIsNeedFU = "false"

  statusQuickHandle : StatusAPI = StatusAPI.LOADING;
  statusAPI = StatusAPI;

  constructor(private httpClient : HttpClient, private userService :UserService){}

  submitQuickHandleManualFixDataUser(message : any){
    this.quickHandleNotes = message;
    this.submitQuickHandleManual();
  }
  
  submitQuickHandleManual(){
    let url = `https://api-tools.apps.ocpdevgra.dti.co.id/v1.0.0/audittrail/piket`;
    let option : any = {observe : "response"};
    let body : any = JSON.parse(JSON.stringify({
      request_id: this.keluhan.requestid,
      handled_by: this.userService.getNama(),
      handled_method: this.quickHandleMethod,
      handled_date: new Date(),
      handled_notes: this.quickHandleNotes,
      is_need_fu: this.quickHandleIsNeedFU
    }))
    this.statusQuickHandle = StatusAPI.LOADING;
    this.httpClient.post(url, body, option) .subscribe((response : any) => {
      if(response.status != 200)
      {
        this.statusQuickHandle = StatusAPI.FAILED;
        return;
      }
      this.statusQuickHandle = StatusAPI.SUCCESS;
      this.keluhan.handled = {
        method : body.handled_method,
        name : body.handled_by,
        date : body.handled_date,
        notes : body.handled_notes,
        isNeedFu: body.is_need_fu == "true"
      } 
    })
  }

  submitQuickHandleSetUnhandled(){
    let url = `https://api-tools.apps.ocpdevgra.dti.co.id/v1.0.0/audittrail/piket/handled/request-id/${this.keluhan.requestid}`;
    let option : any = {observe : "response"};
    this.statusQuickHandle = StatusAPI.LOADING;
    this.httpClient.delete(url, option) .subscribe((response : any) => {
      if(response.status != 200)
      {
        this.statusQuickHandle = StatusAPI.FAILED;
        return;
      }
      this.keluhan.handled = null;
      this.statusQuickHandle = StatusAPI.SUCCESS;

    })
  }

}
