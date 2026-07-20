import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { KJUR, KEYUTIL } from 'jsrsasign';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MsvFormsModule } from '../../../shared/components/msv-forms/msv-forms.module';
import { environment } from 'src/environments/environment';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule, MatIconModule, MatProgressSpinnerModule,
    MsvFormsModule,
  ],
  selector: 'app-push-notif-fcm',
  templateUrl: './push-notif-fcm.component.html',
  styleUrls: ['./push-notif-fcm.component.css'],
})
export class PushNotifFcmComponent {
  requestBody = '';
  response = {
    status: null as string | null,
    message: null as string | null,
    data: null as unknown,
  };
  validationError: string | null = null;

  private readonly destroyRef = inject(DestroyRef);

  private readonly http = inject(HttpClient);

  submit() {
    this.validationError = null;

    if (!this.requestBody || !this.requestBody.trim()) {
      this.validationError = 'Request body is required.';
      return;
    }

    of(0)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.generateAccessToken()),
        switchMap((accessToken: string | null) =>
          this.pushNotifFcm(accessToken),
        ),
      )
      .subscribe({
        next: (response) => {
          this.response.message = 'Success Push Notification';
          this.response.data = response;
          this.response.status = 'SUCCESS';
        },
        error: (e) => {
          this.buildErrorResponse('Error Push Notification FCM', e);
        },
      });
  }

  generateAccessToken(): Observable<string | null> {
    this.response = {
      status: 'ON_PROCESS',
      message: 'Generate Access Token',
      data: null,
    };

    const jwtHeader = { alg: 'RS256', typ: 'JWT' };

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;
    const jwtPayload = {
      iss: environment.fcmClientEmail,
      scope: environment.fcmAuthScope,
      aud: environment.fcmTokenUri,
      exp,
      iat,
    };

    const jwtHeaderStr = JSON.stringify(jwtHeader);
    const jwtPayloadStr = JSON.stringify(jwtPayload);

    const key: unknown = KEYUTIL.getKey(environment.fcmPrivateKey);
    const signedJWT = KJUR.jws.JWS.sign(
      jwtHeader.alg,
      jwtHeaderStr,
      jwtPayloadStr,
      key as Parameters<typeof KJUR.jws.JWS.sign>[3],
    );

    const url = environment.fcmTokenUri;
    const requestBody = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${signedJWT}`;
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    return this.http.post(url, requestBody, { headers }).pipe(
      map((response: unknown) => {
        const r = response as Record<string, unknown>;
        if (r?.['access_token']) {
          return r['access_token'] as string;
        }
        throw new Error(String(response));
      }),
      catchError((error) => {
        this.buildErrorResponse('Error Generating Access Token', error);
        throw new Error(String(error));
      }),
    );
  }

  pushNotifFcm(accessToken: string | null): Observable<unknown> {
    this.response = {
      status: 'ON_PROCESS',
      message: 'Push Notification FCM',
      data: null,
    };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });

    const url = `${environment.fcmBaseUrl}/v1/projects/${environment.fcmProjectId}/messages:send`;
    return this.http.post(url, this.requestBody, { headers }).pipe(
      catchError((error) => {
        this.buildErrorResponse('Error Push Notification FCM', error);
        throw new Error(String(error));
      }),
    );
  }

  private buildErrorResponse(message: string, error: { url?: string; status?: number; headers?: unknown; error?: unknown }) {
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
