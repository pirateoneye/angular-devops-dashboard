import { LOCALE_ID, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from './module/material.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { DatePipe } from '@angular/common';
import { ModalInsertNameComponent } from './shared/component/modal/insert-name/modal-insert-name.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BatchRunnerComponent } from './pages/tools-dev/batch-runner/batch-runner.component';
import { LoginComponent } from './pages/login/login.component';
import { AppRoutingModule } from './app-routing.module';
import { MsvFormsModule } from './shared/components/msv-forms/msv-forms.module';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { registerLocaleData } from '@angular/common';
import localeId from '@angular/common/locales/id';

import { CryptoComponent } from './pages/tools-dev/crypto/crypto.component';
import { DeleteDataComponent } from './pages/tools-dev/delete-data/delete-data.component';
import { ModalConfirmationComponent } from './shared/component/modal/confirmation/modal-confirmation.component';
import { FixDataUserComponent } from './pages/piket/fix-data-user/fix-data-user.component';
import { CheckDataComponent } from './pages/tools-dev/check-data/check-data.component';
import { PiketAuthorizationComponent } from './pages/piket/piket-authorization/piket-authorization.component';
import { KeluhanListComponent } from './pages/piket/keluhan-list/keluhan-list.component';
import { QuickHandleComponent } from './pages/piket/keluhan-list/component/quick-handle/quick-handle.component';
import { GitlabTagsMonitorComponent } from './pages/tools-dev/gitlab/gitlab-tags-monitor/gitlab-tags-monitor.component';
import { GitlabTaskComponent } from './pages/tools-dev/gitlab/gitlab-task/gitlab-task.component';
import { GitlabBulkComponent } from './pages/tools-dev/gitlab/gitlab-bulk/gitlab-bulk.component';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PaimonDupeComponent } from './pages/tools-dev/paimon-dupe/paimon-dupe.component';
import { FixAfterMergeCisComponent } from './pages/piket/fix-after-merge-cis/fix-after-merge-cis.component';
import { FileServerManagerComponent } from './pages/tools-dev/file-server-manager/file-server-manager.component';
import { InputFileUploadComponent } from './shared/component/form/input-file-upload/input-file-upload.component';
import { PushNotifFcmComponent } from './pages/tools-dev/push-notif-fcm/push-notif-fcm.component';
import { PublishKafkaComponent } from './pages/tools-dev/publish-kafka/publish-kafka.component';
import { MsvTestComponent } from './pages/tools-dev/msv-test/msv-test.component';
import { MsvDocsComponent } from './pages/tools-dev/msv-docs/msv-docs.component';
import { CalendarPiketComponent } from './pages/piket/calendar-piket/calendar-piket.component';

registerLocaleData(localeId);

@NgModule({
  declarations: [
    AppComponent,
    ModalInsertNameComponent,
    BatchRunnerComponent,
    LoginComponent,
    CryptoComponent,
    DeleteDataComponent,
    ModalConfirmationComponent,
    FixDataUserComponent,
    CheckDataComponent,
    PiketAuthorizationComponent,
    KeluhanListComponent,
    QuickHandleComponent,
    GitlabTaskComponent,
    GitlabTagsMonitorComponent,
    GitlabBulkComponent,
    PaimonDupeComponent,
    FixAfterMergeCisComponent,
    FileServerManagerComponent,
    InputFileUploadComponent,
    PushNotifFcmComponent,
    PublishKafkaComponent,
    MsvTestComponent,
    MsvDocsComponent,
    CalendarPiketComponent,
  ],
  imports: [
    AppRoutingModule,
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatAutocompleteModule,
    FormsModule,
    MsvFormsModule,
    InfiniteScrollModule,
    ReactiveFormsModule,
  ],
  providers: [
    DatePipe,
    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'id' },
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}




