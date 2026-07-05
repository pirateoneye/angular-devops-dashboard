import { Component } from '@angular/core';
import {
  SelectOption,
  ResponseData,
} from '../../../shared/components/msv-forms/interfaces';
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
  selector: 'app-msv-test',
  templateUrl: './msv-test.component.html',
  styleUrls: ['./msv-test.component.css'],
})
export class MsvTestComponent {
  // msv-input tests
  testInput: string = '';
  testEmail: string = '';
  testPattern: string = '';

  // msv-textarea test
  testTextarea: string = '';

  // msv-select test
  testSelect: string = '';
  selectOptions: SelectOption[] = [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
    { label: 'Option C', value: 'c' },
    { label: 'Disabled Option', value: 'd', disabled: true },
  ];

  // msv-button tests
  lastButtonClicked: string = '';
  isLoading: boolean = false;

  // msv-response-panel test
  testResponse: ResponseData = {
    status: null,
    message: '',
    data: null,
  };

  onTestClick(buttonType: string): void {
    this.lastButtonClicked = buttonType;
  }

  onLoadingTest(): void {
    this.isLoading = true;
    this.lastButtonClicked = 'loading (started)';
    setTimeout(() => {
      this.isLoading = false;
      this.lastButtonClicked = 'loading (finished)';
    }, 2000);
  }

  setTestResponse(status: 'SUCCESS' | 'ERROR' | 'ON_PROCESS'): void {
    this.testResponse = {
      status: status,
      message:
        status === 'SUCCESS'
          ? 'Operation completed successfully!'
          : status === 'ERROR'
            ? 'An error occurred during the operation.'
            : 'Processing your request...',
      data:
        status !== 'ON_PROCESS'
          ? {
              id: 12345,
              timestamp: new Date().toISOString(),
              result: status === 'SUCCESS' ? 'OK' : 'FAILED',
            }
          : null,
    };
  }

  clearTestResponse(): void {
    this.testResponse = { status: null, message: '', data: null };
  }
}
