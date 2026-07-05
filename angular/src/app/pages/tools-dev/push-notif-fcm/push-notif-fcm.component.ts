import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, inject, DestroyRef } from '@angular/core';
import { KJUR, KEYUTIL } from 'jsrsasign';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
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
  selector: 'app-push-notif-fcm',
  templateUrl: './push-notif-fcm.component.html',
  styleUrls: ['./push-notif-fcm.component.css'],
})
export class PushNotifFcmComponent {
  env: string = 'UAT';
  requestBody: string = '';
  response: any = {
    status: null,
    message: null,
    data: null,
  };
  validationError: string | null = null;
  serviceAccount: any = {
    UAT: {
      type: 'service_account',
      project_id: 'merchantservice-bca',
      // TODO: Load from environment config — do not hardcode credentials.
      // Service account JSON should be injected at build time via
      // environment files or fetched from a secure backend proxy.
      private_key_id:
        /* TODO: Load from environment config — do not hardcode credentials */ '',
      private_key:
        /* TODO: Load from environment config — do not hardcode credentials */ '',
      client_email:
        'firebase-adminsdk-b2s44@merchantservice-bca.iam.gserviceaccount.com',
      token_uri: 'https://oauth2.googleapis.com/token',
    },
  };

  private readonly destroyRef = inject(DestroyRef);

  constructor(private http: HttpClient) {}

  submit() {
    this.validationError = null;

    if (!this.requestBody || !this.requestBody.trim()) {
      this.validationError = 'Request body is required.';
      return;
    }

    // of(0) just kicks off the chain; the 0 value itself isn't used.
    // switchMap chains steps: the next only runs after the previous finishes.
    of(0)
      .pipe(
        // auto-unsubscribes when this component is destroyed
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
          console.error('Error', e);
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

    // Membuat payload JWT
    const iat = Math.floor(Date.now() / 1000); // Waktu token dibuat (dalam detik sejak epoch)
    const exp = iat + 3600; // Token berlaku selama 1 jam
    const jwtPayload = {
      iss: this.serviceAccount[this.env].client_email, // Email dari Service Account
      scope: 'https://www.googleapis.com/auth/firebase.messaging', // Scope
      aud: this.serviceAccount[this.env].token_uri, // Audience
      exp: exp, // Waktu kadaluarsa
      iat: iat, // Waktu token dibuat
    };

    const jwtHeaderStr = JSON.stringify(jwtHeader);
    const jwtPayloadStr = JSON.stringify(jwtPayload);

    // Sign the JWT using jsrsasign
    const key: any = KEYUTIL.getKey(this.serviceAccount[this.env].private_key);
    const signedJWT = KJUR.jws.JWS.sign(
      jwtHeader.alg,
      jwtHeaderStr,
      jwtPayloadStr,
      key,
    );

    const url = 'https://oauth2.googleapis.com/token';
    const requestBody = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${signedJWT}`;
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    return this.http.post(url, requestBody, { headers: headers }).pipe(
      map((response: any) => {
        if (response && response.access_token) {
          return response.access_token;
        } else {
          throw new Error(response);
        }
      }),
      catchError((error) => {
        this.buildErrorReponse('Error Generating Access Token', error);
        throw new Error(error);
      }),
    );
  }

  pushNotifFcm(accessToken: string | null): Observable<any> {
    this.response = {
      status: 'ON_PROCESS',
      message: 'Push Notification FCM',
      data: null,
    };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });

    const url = `https://fcm.googleapis.com/v1/projects/${this.serviceAccount[this.env].project_id}/messages:send`;
    return this.http.post(url, this.requestBody, { headers: headers }).pipe(
      catchError((error) => {
        this.buildErrorReponse('Error Push Notification FCM', error);
        throw new Error(error);
      }),
    );
  }

  private buildErrorReponse(message: string, error: any) {
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
