import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { KJUR, KEYUTIL } from 'jsrsasign'; // Impor dari jsrsasign
import { catchError, map, Observable, of, switchMap } from 'rxjs';
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
  selector: 'app-push-notif-fcm',
  templateUrl: './push-notif-fcm.component.html',
  styleUrls: ['./push-notif-fcm.component.css']
})
export class PushNotifFcmComponent {
  env: string = "UAT";
  requestBody: string = "";
  response: any = {
    status : null,
    message : null,
    data: null
  };
  serviceAccount : any = {
    "UAT":
    {
      "type": "service_account",
      "project_id": "merchantservice-bca",
      "private_key_id": "f9270cb396f879a9643857508e44a0cedc0220f4",
      "private_key": `-----BEGIN PRIVATE KEY-----
    MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCzCl6Dm5Wc3p0c
    4aZYwde+qJLd5UEx0CgfEA0ZOmkgkUaHQ4YlZvfc4pI8A4meqKGlfeZnETnXTa4W
    sDIm6rDYR1W1LelYEc4aoCvYgNMZ9t9udZd+25whXO/+mkRfVordoLlQUps2GQh2
    SBfM5LHHWlgvgs0GXNPV7/aZGAfsKWPes/FEPV3+mDcsu/doRXBvaZFYlo+xaFnB
    PiQnKhzjVKU8VbS/QdvlDjaVOEJaiHgj/A2YUFW0PEkudoYHa3eLSoGuKr4YPzWL
    HsRR76NB00ilv+QmOlABv1n+FyoAE+yCNdmq5o/IjCd6KlXnpsT1twJzat/H4BE+
    MpzqvhGBAgMBAAECggEABzBh5ifvpHpd1aSL4OF7r7imGQnVCdKBYenrlLk/MmMS
    8Wh5MPRG/JQOaiF8O6Yqw3HgOAA9kdMZK+kMQnrG+hA3NUywI2ynmXMX/5wAnfjH
    NPC80gewZ7iLHG6GU0uuzMJg3oRKniv4JoOzjPMb3lTW2KWIZPqCOQNnI/OOkeFw
    YhdMqUPk8G5UMmxcqGTVehPS50p4rxo9t1kaR3i3cEISnnLNWauLrYTG2ahJpcfE
    RRQqBWXOOL47TXDblaKaSAzDf+o84MO1P2jLmBtlFUt0WgQ6c3Zc/9w1kYmrHuTW
    qD1882bjeoDUGzgodm7PG404/NpEmreabm9ugg2RNwKBgQDbG1022j+j38vibVIQ
    YIi+56KB+0SFzVcdcynDOxlUfGlN6ZcqS6jjtrS9GuVf3zv+yWyF3zOXoK02babb
    5LXRwuprYQL1gWLZgqCufO/Pfgzy1KKwm1GJk0z3yZjfExarKuMt4a7RIOskrYNy
    85VeTedmdYriLQemCiO1e8lOUwKBgQDRL+/5DtTln23CdVO2zTjjQCXpp/9NTP6G
    t78ZBdiP4hQQ42ljo2wWk2HahiFWiJYQTaDirTZEhEQD2iNG2+sD8A/4RbCuRif+
    7Ah4SrZ1FwuWH6mI/LMgl0kLmWa8G7zZVofRTJ0sf2vVzSlGzjLQUX0ognJbYxUC
    9gFKOcieWwKBgQC9YqasjfLqK7voSEPhof8wu7jMjypIWRfOfceAV6nqS+sdjCW8
    Sk9+HGOW/RN8TdFmxiXGhQnsKtbtL9RFRygdWlQTYnQTTrXpei53A8io2bRJhJ/m
    9SmCN88Ucq1vS+mRI+3fr63SV5jISC5Rgtf9/mpgNoNIQlHVI/h/mrKCvwKBgQCi
    I4LgS6Oum2UqvV/2p5i5Y6Y/NizHUK9T4iYnkgVqeLRO5sVwKmIEGZZWF3LNrK6L
    0m+qYtFWSCKjzbdcG+dMNQ1bxUCNw+kKSQ7Dlj1YAlXDtaTlfeClmT1P1UXw9Zrp
    5oz9KGIG9HizzgJ5VCfEmfTlqj5TIThPBDi5vJIIUwKBgAt2juqY4bggqWJWNAP0
    73julelAa/KICBDJTIscOtYUmRQCyU3EfOze2RgUVANqfeHIEXm1SDQo0JUx2/uw
    6OIpZK6m+Z6dxRBgW878kEKI1RdnAAPndhmQpYUG71WwczmUQziTw6/yUWjmvrZP
    iAl8A0PJ7nkO39+Hx2mK5wbs
    -----END PRIVATE KEY-----`,
      "client_email": "firebase-adminsdk-b2s44@merchantservice-bca.iam.gserviceaccount.com",
      "token_uri": "https://oauth2.googleapis.com/token"
    }
  };

  constructor(private http: HttpClient) { }

  submit() {
    of(0).pipe(
      switchMap(() => this.generateAccessToken()),
      switchMap((accessToken : string | null) => this.pushNotifFcm(accessToken)),
    ).subscribe((response) => {
      console.info("Final", response); 
      this.response.message = 'Success Push Notification';
      this.response.data = response;
      this.response.status = "SUCCESS";
    }, 
    (e) => {
      console.error("Error",  e);  
    });
  }

  generateAccessToken(): Observable<string | null> {
    this.response = {status : "ON_PROCESS", message : "Generate Access Token", data: null}

    const jwtHeader = { alg: 'RS256', typ: 'JWT' };

    // Membuat payload JWT
    const iat = Math.floor(Date.now() / 1000); // Waktu token dibuat (dalam detik sejak epoch)
    const exp = iat + 3600; // Token berlaku selama 1 jam
    const jwtPayload = {
      iss: this.serviceAccount[this.env].client_email, // Email dari Service Account
      scope: "https://www.googleapis.com/auth/firebase.messaging", // Scope
      aud: this.serviceAccount[this.env].token_uri, // Audience
      exp: exp, // Waktu kadaluarsa
      iat: iat  // Waktu token dibuat
    };

    const jwtHeaderStr = JSON.stringify(jwtHeader);
    const jwtPayloadStr = JSON.stringify(jwtPayload);

    // Sign the JWT using jsrsasign
    const key : any= KEYUTIL.getKey(this.serviceAccount[this.env].private_key);
    const signedJWT = KJUR.jws.JWS.sign(jwtHeader.alg, jwtHeaderStr, jwtPayloadStr, key); 
    console.log("signedJwt", signedJWT);
    
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
      catchError(error => {
        this.buildErrorReponse('Error Generating Access Token', error);
        throw new Error(error);
      })
    );
  }

  pushNotifFcm(accessToken : string | null): Observable<any> {
    this.response = {status : "ON_PROCESS", message : "Push Notification FCM", data: null}

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    });

    let url = `https://fcm.googleapis.com/v1/projects/${this.serviceAccount[this.env].project_id}/messages:send`;
    return this.http.post(url, this.requestBody, { headers: headers }).pipe(
      catchError(error => {
        this.buildErrorReponse('Error Push Notification FCM', error);
        throw new Error(error);
      })
    );
  }

  private buildErrorReponse(message : string, error : any){
    this.response.message = message;
    this.response.data = {
      url: error.url,
      status : error.status,
      headers: error.headers,
      body: error.error
    };
    this.response.status = "ERROR";
  }

}
