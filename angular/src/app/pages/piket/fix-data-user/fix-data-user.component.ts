import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ModalConfirmationComponent } from 'src/app/shared/component/modal/confirmation/modal-confirmation.component';
import { BehaviorSubject, catchError, combineLatest, concatMap, from, mergeMap, Observable, of, skip, switchMap, takeUntil, tap, throwError, timeout, toArray } from 'rxjs';
import { Router } from '@angular/router';
import { log } from '@angular-devkit/build-angular/src/builders/ssr-dev-server';
import { IndukCicilan } from 'src/app/shared/model/interface/indukcicilan.interface';
import { UserMessi } from 'src/app/shared/model/interface/user-messi.interface';
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
  selector: 'app-fix-data-user',
  templateUrl: './fix-data-user.component.html',
  styleUrls: ['./fix-data-user.component.css']
})
export class FixDataUserComponent {

  @Input() email : string = "";
  @Input() mid : string = "";
  @Output() afterSubmit = new EventEmitter<any>();
  @ViewChild('logContainer') logContainer! : ElementRef;

  data : any = {};
  response : any = {
    status : null,
    message : null,
    data : null
  }
  logs : {date : Date, message: string, level: string, status: string | null }[] = [
  ]
  result : {date : Date, message: string,  status: string} | null = null;
  setTimeout = 15000;

  constructor(private httpClient : HttpClient, 
                private router: Router){}

  onClickSubmitButton(){
      console.log("Submit")
      this.logs = [];
      this.result = null;
      this.data = {};
      this.response.status = "ON_PROCESS";
      this.response.data = null;
      of(0).pipe(
        switchMap(() => this.getUser()),
        switchMap(() => this.getIndukCicilan(this.data.user.attributes.mid[0], 'user_attribute')),
        switchMap(() => this.getIndukCicilan(this.mid, 'mid_target')),
        switchMap(() => this.comparingCis(this.data.outlet['user_attribute'].cis, this.data.outlet['mid_target'].cis)),
        switchMap(() => this.checkRole()),
        switchMap(() => this.getPemilik(this.data.outlet['user_attribute'].cis)),
        switchMap(() => this.comparingEmailPemilik()),
        switchMap(() => this.filterListMid()),
        switchMap(() => this.putEditUser())
      ).subscribe((response) => {
        console.info("Final", response); 
        let message =  "Success Fix Data User";
        this.result = {date: new Date(), message: message,  status: "SUCCESS"};
        this.afterSubmit.emit(message);
        this.response.status =  "SUCCESS"
      }, 
      (e) => {
        console.error("Error",  e);  
        this.result = {date: new Date(), message: (<Error>e).message,  status: "ERROR"}; 
        this.afterSubmit.emit((<Error>e).message);
        console.info("this.data", this.data); 
        this.response.status =  "ERROR"
      })
  }

  private getAuthMessi() {
    let time = new Date().getTime().toString();
    let body = new URLSearchParams();
    body.set('client_id',  'admin-cli');
    body.set('client_secret', '1db8b9d7-f851-4c89-9bba-79dbe751a255');
    body.set('grant_type',  'client_credentials');
    body.set('scope',  'openid');;
    let url = "https://asis.com/messi.api.gateway/v1/sso/auth/realms/bca/protocol/openid-connect/token";
    let options : any =  {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
      observe: "response"
    };
    console.log("body: ",body)
    console.log("options: ",options)
    return this.httpClient.post(url, body, options).pipe(
        takeUntil(this.router.events.pipe(skip(1))),
        timeout(this.setTimeout));
  }

  private getUser(){
    this.addLogs({date: new Date(), message: "GET User From Messi", level: "SERVICE", status: "NOSTATUS"})
    return this.getAuthMessi().pipe(switchMap((response : any) => {
      let url = `https://asis.com/messi.api/v1/sso/f55e7b79-f6c2-41aa-bbc9-1f53788d04fd/user?email=${this.email}`;
      let options : any =  {
        headers: new HttpHeaders().set('Authorization', `Bearer ${response.body.access_token}`),
        observe: "response"
      };
      return this.httpClient.get(url, options);
    }), switchMap((response : any) => {
        if(response.body.length == 0){
          throw new Error("User not found. Please request check this merchant to Magenta Support or Messi.");
        }
        this.addLogs({date: new Date(), message: "User Found!", level: "MESSAGE", status: "SUCCESS"})
        this.data.user =response.body[0] as UserMessi;
        console.log(this.data)
        return of(response.body);
    }))
  }

  private getIndukCicilan(mid : string, source : string){
    let url = `https://asiss.com/api.merchant_v2.0.0/v1.0.0/Outlet/IndukCicilan/${mid}`;
    this.addLogs({date: new Date(), message: `GET Induk Cicilan From ${source}`, level: "SERVICE", status: "NOSTATUS"})
    let options : any =  {
      observe: "response"
    };
    return this.httpClient.get(url, options).pipe(switchMap((response : any) => {
      if(response.status == 204){
        throw new Error(`Outlets From ${source} Not Found`);
      }
      this.addLogs({date: new Date(), message: `Outlets From ${source} Found!`, level: "MESSAGE", status: "SUCCESS"})
      let content = response.body.content[0] as IndukCicilan;
      this.data.outlet != null ? this.data.outlet[source] = content : this.data.outlet = { [source] : content};
      console.log(this.data)
      return of(response.body);
    }));
  }

  private comparingCis(cisUser: string ,cisTarget : string){
    this.logs.push({date: new Date(), message: "Comparing CIS User Attribute with CIS Target", level: "ACTION", status: "NOSTATUS"})
    if(cisUser != cisTarget){
      throw new Error(`CIS is not Same, Please request merge CIS. CIS User: ${cisUser}, CIS Target: ${cisTarget}`);
    }
    this.addLogs({date: new Date(), message: "CIS User Attribute is same with CIS Target!", level: "MESSAGE", status: "SUCCESS"})
    return of("OK");
  }

  private checkRole(){
    this.addLogs({date: new Date(), message: "Checking Role User", level: "ACTION", status: "NOSTATUS"})
    let user = this.data.user;
    if(user.clientRoles == null || !user.clientRoles["bca-mcb"] || user.clientRoles["bca-mcb"].length == 0){
      this.data.isRoleNotFound =true;
      this.addLogs({date: new Date(), message: "Role Not Found", level: "MESSAGE", status: "ERROR"})
    }
    else if(user.clientRoles["bca-mcb"][0].toUpperCase() != "PEMILIK"){
      throw new Error(`Role user is ${user.clientRoles["bca-mcb"][0]}. This tools is just for Fix Data User Pemilik`);
    }
    else{
      this.data.isRoleNotFound =false;
      this.addLogs({date: new Date(), message: `Role Found as  ${user.clientRoles["bca-mcb"][0]}`, level: "MESSAGE", status: "SUCCESS"})
    }
    return of("OK");
  }

  private getPemilik(cis : string){
    if(this.data.isRoleNotFound)
    {
      let url = `https://asiss.com/api.merchant_v2.0.0/v1.0.0/Pemilik/getPemilikMerchantByCis/${cis}`;
      this.addLogs({date: new Date(), message: `GET Pemilik By CIS`, level: "SERVICE", status: "NOSTATUS"})
      let options : any =  {
        observe: "response"
      };
      return this.httpClient.get(url, options).pipe(switchMap((response : any) => {
        if(response.status != 200){
          throw new Error(`GET Pemilik By CIS Magenta Error: ` + JSON.stringify(response));
        }
        let content = response.body.content[0];
        this.data.emailPemilik = content.email;
        this.addLogs({date: new Date(), message: `Pemilik Found!`, level: "MESSAGE", status: "SUCCESS"})
        console.log(this.data)
        return of("OK");
      }));
    }
    return of("OK");
  }

  private comparingEmailPemilik(){
    if(this.data.isRoleNotFound)
    {
      this.addLogs({date: new Date(), message: "Comparing Email Pemilik Magenta with Email Target", level: "ACTION", status: "NOSTATUS"})
      if(this.email.toLowerCase() != this.data.emailPemilik.toLowerCase() && this.data.user.attributes.isexisting[0] == "false"){
        throw new Error(`Email is not Same and is not merchant existing, Please request ubah data from cabang. Email Pemilik Magenta: ${this.data.emailPemilik}, Email Target: ${this.email}`);
      }
      if(this.data.user.attributes.isexisting[0] == "true"){
        this.addLogs({date: new Date(), message: "Email is from merchant existing", level: "MESSAGE", status: "SUCCESS"})
      }
      else{
        this.addLogs({date: new Date(), message: "Email Pemilik Magenta is same with Email Target!", level: "MESSAGE", status: "SUCCESS"})
      }
      return of("OK");
    }
    return of("OK");
  }

  private filterListMid(){
    this.addLogs({date: new Date(), message: `Filtering List MID`, level: "ACTION", status: "NOSTATUS"})
    let indukCicilan : IndukCicilan = this.data.outlet["mid_target"];
    let listNotRegisteredPTEN : string[] = [];
    let listCicilan0 : string[] = [];
    let listMid : string[] =[];
    let listNotFilteredQrisStatis : string[] =[];
    let isQrisStatis : boolean = false;
    indukCicilan.outlet.forEach((o) =>{
      if(o.iscicilan0){
        listCicilan0.push(o.mid);
      }
      else if(o.jenisOutlet.toUpperCase() == "QRIS STATIS"){
        isQrisStatis = true;
        if(o.qrisNmid == null){
          listNotRegisteredPTEN.push(o.mid);
        }
        else{
          listNotFilteredQrisStatis.push(o.mid);
        }
      }
      else if(o.jenisOutlet.toUpperCase() == "RETAIL" || o.jenisOutlet.toUpperCase() == "PAMERAN"){
        listMid.push(o.mid);
      }
    })

    console.log('listNotFilteredQrisStatis', listNotFilteredQrisStatis);

    let options : any =  {observe : 'response', responseType: 'blob'};
    
    return from(listNotFilteredQrisStatis).pipe(concatMap((mid) => 
      this.httpClient.get(`https://auhau.com/v1/qris-static/detail/${mid}`, options).pipe(
      tap((response : any) => {
        if(response.status == 204){
          this.addLogs({date: new Date(), message: `Sticker For MID ${mid} is not Found with error ${response.status}`, level: "MESSAGE", status: "FAILED"})
          listNotRegisteredPTEN.push(mid)
          return;
        }else if(response.status == 200){
          this.addLogs({date: new Date(), message: `Sticker For MID ${mid} is Found`, level: "MESSAGE", status: "SUCCESS"})
          listMid.push(mid)
        }
        else{
          throw new Error('Service get image QRIS Statis Error');
        }
        }),
      catchError((error) => {
        if(error.status == 409)
        {
          this.addLogs({date: new Date(), message: `Sticker For MID ${mid} is not Found with error ${error.status}`, level: "MESSAGE", status: "FAILED"})
          listNotRegisteredPTEN.push(mid)
          return [];
        }
        throw new Error('Service get image QRIS Statis Error');
        }))
    ), 
    toArray(),
    switchMap(() => {
      let other : any = {};
      if(listNotRegisteredPTEN.length != 0){
        other["listNotRegisteredPTEN"] = listNotRegisteredPTEN;
      }
      if(listCicilan0.length != 0){
        other["listCicilan0"] = listCicilan0;
      }
      console.log(other)
  
      if(listMid.length == 0){
        this.response.data = {other : other};
        throw new Error('List MID is Empty');
      }
  
      this.data.listMid = listMid;
      this.data.isQrisStatis = isQrisStatis;
      this.data.other = other;
      this.addLogs({date: new Date(), message: `Filtering List MID Done`, level: "MESSAGE", status: "SUCCESS"})
      return of('OK');
    }))
  }

  private putEditUser(){
    this.addLogs({date: new Date(), message: `PUT Edit User Messi`, level: "SERVICE", status: "NOSTATUS"})
    let user : UserMessi = JSON.parse(JSON.stringify(this.data.user));
    let indukCicilan : IndukCicilan = this.data.outlet["mid_target"];

    //Set Client Roles
    let clientRoles : any = user.clientRoles != null && user.clientRoles["bca-mcb"] != null ? {"bca-mcb" : user.clientRoles["bca-mcb"]} : {"bca-mcb" : ["pemilik"]}
    if(this.data.isQrisStatis ){
      clientRoles["bca-qrms"] = clientRoles["bca-mcb"];
    }
    
    //Set Fix User
    user.clientRoles = clientRoles;
    user.attributes.mid = this.data.listMid;
    user.attributes.cin = [indukCicilan.cis];
    console.log(this.data);
    console.log('result user', user);
    return this.getAuthMessi().pipe(switchMap((response : any) => {
      let url = `https://asis.com/messi.api/v1/sso/8877ab1e-1881-402b-9f06-62f4db8c7829/users/${user.id}`;
      let options : any =  {
        headers: new HttpHeaders().set('Authorization', `Bearer ${response.body.access_token}`),
        observe: "response"
      };
      return this.httpClient.put(url, user, options);
    }), switchMap((response : any) => {
        if(response.status != 204){
          throw new Error(`PUT Edit User Messi Error: ` + JSON.stringify(response));
        }

        let responseData = {
          before:this.data.user,
          after:user,
          other: this.data.other 
        }
        this.response.data =  responseData;
        console.log(this.response);
        this.addLogs({date: new Date(), message: "Edit User Success", level: "MESSAGE", status: "SUCCESS"})
        return of("OK");
    }))
  }

  addLogs(data :  {date : Date, message: string, level: string, status: string | null }){
    this.logs.push(data)
    setTimeout(() => {
      const element = this.logContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }, 0);
  }

}
