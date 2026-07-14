import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, inject, DestroyRef } from '@angular/core';
import { catchError } from 'rxjs';
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
  selector: 'app-publish-kafka',
  templateUrl: './publish-kafka.component.html',
  styleUrls: ['./publish-kafka.component.css'],
})
export class PublishKafkaComponent {
  principle: string = 'MCB';
  topic: string = '';
  requestBody: string = '';
  response: any = {
    status: null,
    message: null,
    data: null,
  };
  validationError: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(private http: HttpClient) {}

  submit() {
    this.validationError = null;

    if (this.response.status == 'ON_PROCESS') {
      return;
    }

    if (!this.topic || !this.topic.trim()) {
      this.validationError = 'Topic is required.';
      return;
    }
    if (!this.requestBody || !this.requestBody.trim()) {
      this.validationError = 'Request body is required.';
      return;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    this.response = {
      status: 'ON_PROCESS',
      message: 'Sending to Broker',
      data: null,
    };
    const url = `https://api-tools.apps.ocpdevgra.dti.co.id/v1.0.0/utils/send/kafka/${this.principle}/${this.topic}`;
    return this.http
      .post(url, this.requestBody, { headers: headers, observe: 'response' })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          this.buildErrorResponse('Error Publish Kafka', error);
          throw new Error(error);
        }),
      )
      .subscribe({
        next: (response: any) => {
          this.response.message = 'Success Publish Kafka';
          this.response.data = response;
          this.response.status = 'SUCCESS';
        },
      });
  }

  private buildErrorResponse(message: string, error: any) {
    this.response.message = message;
    this.response.data = {
      url: error.url,
      status: error.status,
      headers: error.headers,
      body: error.error,
    };
    this.response.status = 'ERROR';
  }
}
