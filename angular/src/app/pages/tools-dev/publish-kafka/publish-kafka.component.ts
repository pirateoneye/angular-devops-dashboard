import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { catchError, Observable } from 'rxjs';
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
  selector: 'app-publish-kafka',
  templateUrl: './publish-kafka.component.html',
  styleUrl: './publish-kafka.component.css'
})
export class PublishKafkaComponent {
  principle: string = "MCB";
  topic: string = "";
  requestBody: string = "";
  response: any = {
    status: null,
    message: null,
    data: null
  };

  constructor(private http: HttpClient) { }


  submit() {
    if(this.response.status == "ON_PROCESS"){
      return;
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    this.response = {status : "ON_PROCESS", message : "Sending to Broker", data: null}
    let url = `https://api-tools.apps.ocpdevgra.dti.co.id/v1.0.0/utils/send/kafka/${this.principle}/${this.topic}`;
    return this.http.post(url, this.requestBody, {headers : headers, observe: "response" }).pipe(
      catchError(error => {
        this.buildErrorReponse('Error Push Notification FCM', error);
        throw new Error(error);
      })
    ).subscribe((response : any) => {
      this.response.message = 'Success Publish Kafka';
      this.response.data = response;
      this.response.status = "SUCCESS";
    });
  }

  private buildErrorReponse(message: string, error: any) {
    this.response.message = message;
    this.response.data = {
      url: error.url,
      status: error.status,
      headers: error.headers,
      body: error.error
    };
    this.response.status = "ERROR";
  }

}
