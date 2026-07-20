import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MCB_TOOLS_UTILS_SEND_KAFKA } from 'src/app/core/constant/api.constant';
import {Component, inject, DestroyRef, ChangeDetectionStrategy} from '@angular/core';
import { catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule, MatIconModule, MatProgressSpinnerModule,
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

  private readonly http = inject(HttpClient);

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
    const url = `${MCB_TOOLS_UTILS_SEND_KAFKA}`.replace('{principle}', this.principle).replace('{topic}', this.topic);
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
