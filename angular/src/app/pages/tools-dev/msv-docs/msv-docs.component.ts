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
  selector: 'app-msv-docs',
  templateUrl: './msv-docs.component.html',
  styleUrls: ['./msv-docs.component.css'],
})
export class MsvDocsComponent {
  // Demo values for interactive examples
  testInput: string = '';
  testEmail: string = '';
  testTextarea: string = '';
  testSelect: string = '';
  isLoading: boolean = false;

  // Custom validator demo
  testCustomValidator: string = '';
  validatePassword = (val: string): string | null => {
    if (!val) return 'Password is required';
    if (val.length < 8) return 'Minimum 8 characters required';
    if (!/[A-Z]/.test(val)) return 'Must contain uppercase letter';
    if (!/[0-9]/.test(val)) return 'Must contain number';
    return null;
  };
  customPasswordValidators: any[];

  // Content projection demo
  testPrefixSuffix: string = '';

  constructor() {
    this.customPasswordValidators = [
      { type: 'custom', fn: this.validatePassword },
    ];
  }

  // Select options for demo
  selectOptions: SelectOption[] = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
    { label: 'Option 3', value: '3' },
    { label: 'Disabled Option', value: '4', disabled: true },
  ];

  // Demo response data
  demoResponse: ResponseData = {
    status: 'SUCCESS',
    message: 'Operation completed successfully',
    data: { userId: 123, timestamp: new Date().toISOString() },
  };

  // Code examples as properties
  readonly moduleImportExample = `import { MsvFormsModule } from './shared/components/msv-forms/msv-forms.module';

@NgModule({
  imports: [
    MsvFormsModule
  ]
})
export class AppModule { }`;

  readonly inputExample = `<msv-input
  label="Username"
  placeholder="Enter username"
  [(ngModel)]="username"
  [validators]="['required', 'minLength:3']"
></msv-input>`;

  readonly textareaExample = `<msv-textarea
  label="Description"
  placeholder="Enter description"
  [(ngModel)]="description"
  [rows]="5"
  [validators]="['required', 'minLength:10']"
></msv-textarea>`;

  readonly selectExample = `<msv-select
  label="Category"
  [(ngModel)]="selectedCategory"
  [options]="categoryOptions"
  [validators]="['required']"
></msv-select>

// In component:
categoryOptions: SelectOption[] = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' }
];`;

  readonly buttonExample = `<msv-button variant="primary" (clicked)="onSubmit()">
  Submit
</msv-button>

<msv-button variant="primary" [loading]="isLoading">
  Save
</msv-button>

<msv-button variant="danger" (clicked)="onDelete()">
  Delete
</msv-button>`;

  readonly statusBadgeExample = `<msv-status-badge status="SUCCESS"></msv-status-badge>
<msv-status-badge status="ERROR"></msv-status-badge>
<msv-status-badge status="ON_PROCESS"></msv-status-badge>`;

  readonly responsePanelExample = `<msv-response-panel
  [response]="apiResponse"
  [showData]="true"
></msv-response-panel>

// In component:
apiResponse: ResponseData = {
  status: 'SUCCESS',
  message: 'Data saved successfully',
  data: { id: 123, name: 'John' }
};`;

  readonly interfacesExample = `interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

interface ResponseData {
  status: 'SUCCESS' | 'ERROR' | 'ON_PROCESS' | null;
  message?: string;
  data?: any;
}

type ValidatorType =
  | 'required'
  | 'email'
  | 'minLength:N'
  | 'maxLength:N'
  | 'pattern:REGEX';`;

  readonly globalConfigExample = `// In app.config.ts or main.ts
import { provideMsvFormsConfig } from './shared/components/msv-forms/msv-forms.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideMsvFormsConfig({
      validationMessages: {
        required: 'This field is required',
        email: 'Invalid email format',
        minLength: (min) => \\\`Minimum \\\${min} characters\\\`,
        maxLength: (max) => \\\`Maximum \\\${max} characters\\\`,
        pattern: 'Invalid format'
      },
      loadingText: 'Loading...'
    })
  ]
};`;

  readonly customValidatorsExample = `// Object-based validator with custom message
<msv-input
  label="Username"
  [(ngModel)]="username"
  [validators]="[
    { type: 'required', message: 'Username is required!' },
    { type: 'minLength', value: 3, message: 'Username too short!' }
  ]"
></msv-input>

// Custom function validator
<msv-input
  label="Password"
  [(ngModel)]="password"
  [validators]="[
    { type: 'custom', fn: validatePassword }
  ]"
></msv-input>

// In component:
validatePassword = (val: string): string | null => {
  if (!val) return 'Password required';
  if (val.length < 8) return 'Min 8 characters';
  if (!/[A-Z]/.test(val)) return 'Needs uppercase';
  if (!/[0-9]/.test(val)) return 'Needs number';
  return null;
};`;

  readonly contentProjectionExample = `<!-- Prefix with icon -->
<msv-input
  label="Email"
  [(ngModel)]="email"
>
  <span msvPrefix style="margin-right: 8px;">📧</span>
</msv-input>

<!-- Suffix with icon -->
<msv-input
  label="Search"
  [(ngModel)]="search"
>
  <span msvSuffix style="margin-left: 8px;">🔍</span>
</msv-input>

<!-- Button with icons -->
<msv-button variant="primary">
  <span msvPrefix>⭐</span>
  Save
  <span msvSuffix>✓</span>
</msv-button>`;

  readonly customTemplatesExample = `<!-- Custom error template -->
<ng-template #myErrorTemplate let-errors>
  <div style="color: #ff6b6b; font-weight: bold;">
    ⚠️ {{ errors[0] }}
  </div>
</ng-template>

<msv-input
  label="Custom Error Style"
  [(ngModel)]="value"
  [validators]="['required']"
  [errorTemplate]="myErrorTemplate"
></msv-input>

<!-- Custom loading template -->
<ng-template #myLoadingTemplate>
  <span>⏳ Please wait...</span>
</ng-template>

<msv-button
  variant="primary"
  [loading]="isLoading"
  [loadingTemplate]="myLoadingTemplate"
>
  Submit
</msv-button>`;

  readonly cssVariablesExample = `/* Override in your global styles.css or component CSS */
:root {
  /* Colors */
  --msv-primary-color: #007bff;
  --msv-error-color: #e74c3c;
  --msv-success-color: #2ecc71;
  --msv-warning-color: #f39c12;
  --msv-border-color: #ddd;
  --msv-focus-color: #0056b3;
  
  /* Typography */
  --msv-font-family: 'Inter', sans-serif;
  
  /* Sizing & Spacing */
  --msv-border-radius: 8px;
  --msv-input-height: 48px;
  --msv-input-padding: 8px 12px;
}

/* Component-specific override */
.my-form {
  --msv-primary-color: #6c63ff;
  --msv-border-radius: 12px;
}`;

  // Form Controls Examples
  readonly checkboxExample = `<msv-checkbox
  label="Accept terms and conditions"
  [(ngModel)]="acceptTerms"
  [validators]="['required']"
></msv-checkbox>`;

  readonly checkboxGroupExample = `<msv-checkbox-group
  [(ngModel)]="selectedFeatures"
  [options]="featureOptions"
  [direction]="'vertical'"
  [validators]="['required']"
></msv-checkbox-group>

// In component:
featureOptions: SelectOption[] = [
  { label: 'Email notifications', value: 'email' },
  { label: 'SMS alerts', value: 'sms' },
  { label: 'Push notifications', value: 'push' }
];`;

  readonly radioExample = `<msv-radio
  [(ngModel)]="selectedOption"
  [options]="radioOptions"
  [direction]="'vertical'"
  [validators]="['required']"
></msv-radio>

// In component:
radioOptions: SelectOption[] = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b' },
  { label: 'Option C', value: 'c' }
];`;

  readonly toggleExample = `<msv-toggle
  label="Enable dark mode"
  [(ngModel)]="darkMode"
  [labelPosition]="'after'"
></msv-toggle>`;

  readonly numberExample = `<msv-number
  label="Quantity"
  placeholder="Enter quantity"
  [(ngModel)]="quantity"
  [min]="1"
  [max]="100"
  [step]="1"
  [showButtons]="true"
  [validators]="['required']"
></msv-number>`;

  readonly datepickerExample = `<msv-datepicker
  label="Select date"
  placeholder="Choose a date"
  [(ngModel)]="selectedDate"
  [minDate]="minDate"
  [maxDate]="maxDate"
  [validators]="['required']"
></msv-datepicker>`;

  readonly fileUploadExample = `<msv-file-upload
  label="Upload files"
  [(ngModel)]="uploadedFiles"
  [accept]="'image/*'"
  [multiple]="true"
  [maxSize]="5242880"
  [maxFiles]="5"
  (fileSelected)="onFilesSelected($event)"
></msv-file-upload>`;

  // Feedback Examples
  readonly spinnerExample = `<msv-spinner size="medium"></msv-spinner>
<msv-spinner size="small" color="#007bff"></msv-spinner>
<msv-spinner size="large"></msv-spinner>`;

  readonly progressExample = `<msv-progress
  [value]="75"
  [showLabel]="true"
  [color]="'primary'"
></msv-progress>

<msv-progress
  [value]="50"
  [color]="'success'"
  [striped]="true"
  [animated]="true"
></msv-progress>`;

  readonly alertExample = `<msv-alert
  type="success"
  title="Success!"
  [dismissible]="true"
  (dismissed)="onAlertDismissed()"
>
  Your changes have been saved successfully.
</msv-alert>

<msv-alert type="error" title="Error">
  Something went wrong. Please try again.
</msv-alert>`;

  readonly tooltipExample = `<!-- Tooltip is typically used as a directive -->
<button msvTooltip="Click to submit">Submit</button>
<span msvTooltip="Helpful information">Hover me</span>`;

  readonly toastExample = `// In component:
constructor(private toastService: MsvToastService) {}

showToast() {
  this.toastService.show({
    type: 'success',
    message: 'Operation completed!',
    duration: 3000
  });
}`;

  readonly modalExample = `<!-- Using MsvModalService -->
// In component:
constructor(private modalService: MsvModalService) {}

openModal() {
  const modalRef = this.modalService.open(MyModalComponent, {
    size: 'medium',
    closable: true
  });
}

<!-- Or using component directly -->
<msv-modal [closable]="true" [size]="'medium'">
  <div msvModalHeader>
    <h3>Modal Title</h3>
  </div>
  <div>Modal content goes here</div>
  <div msvModalFooter>
    <msv-button variant="primary">Save</msv-button>
  </div>
</msv-modal>`;

  // Layout Examples
  readonly cardExample = `<msv-card [elevation]="2" [padding]="true">
  <div msvCardHeader>
    <h3>Card Header</h3>
  </div>
  <div>
    Card body content goes here
  </div>
  <div msvCardFooter>
    <msv-button variant="primary">Action</msv-button>
  </div>
</msv-card>`;

  readonly dividerExample = `<msv-divider></msv-divider>

<msv-divider [text]="'OR'" [orientation]="'horizontal'"></msv-divider>

<msv-divider [dashed]="true"></msv-divider>

<msv-divider [orientation]="'vertical'"></msv-divider>`;

  readonly tabsExample = `<msv-tabs [(selectedIndex)]="selectedTab">
  <msv-tab label="Tab 1">
    Content for tab 1
  </msv-tab>
  <msv-tab label="Tab 2">
    Content for tab 2
  </msv-tab>
  <msv-tab label="Tab 3" [disabled]="true">
    Content for tab 3
  </msv-tab>
</msv-tabs>`;

  readonly accordionExample = `<msv-accordion [multi]="false">
  <msv-accordion-item title="Panel 1" [expanded]="true">
    Content for panel 1
  </msv-accordion-item>
  <msv-accordion-item title="Panel 2">
    Content for panel 2
  </msv-accordion-item>
  <msv-accordion-item title="Panel 3">
    Content for panel 3
  </msv-accordion-item>
</msv-accordion>`;

  // Data Display Examples
  readonly avatarExample = `<msv-avatar
  [src]="'path/to/image.jpg'"
  [name]="'John Doe'"
  [size]="'medium'"
  [shape]="'circle'"
></msv-avatar>

<msv-avatar [name]="'Jane Smith'" [size]="'large'"></msv-avatar>`;

  readonly tagExample = `<msv-tag [color]="'primary'">Primary</msv-tag>
<msv-tag [color]="'success'">Success</msv-tag>
<msv-tag [color]="'warning'" [removable]="true" (removed)="onRemove()">
  Removable
</msv-tag>`;

  readonly badgeExample = `<msv-badge [value]="5" [color]="'error'">
  <span>Notifications</span>
</msv-badge>

<msv-badge [value]="150" [max]="99" [color]="'primary'">
  <span>Messages</span>
</msv-badge>

<msv-badge [dot]="true" [color]="'success'">
  <span>Online</span>
</msv-badge>`;

  readonly listExample = `<msv-list
  [selectable]="true"
  [multiple]="false"
  (selectionChange)="onSelectionChange($event)"
>
  <msv-list-item [value]="'item1'">Item 1</msv-list-item>
  <msv-list-item [value]="'item2'">Item 2</msv-list-item>
  <msv-list-item [value]="'item3'" [disabled]="true">
    Item 3 (disabled)
  </msv-list-item>
</msv-list>`;

  readonly tableExample = `<msv-table
  [data]="tableData"
  [columns]="columns"
  [sortable]="true"
  [paginator]="true"
  [pageSize]="10"
  (rowClick)="onRowClick($event)"
  (sortChange)="onSortChange($event)"
></msv-table>

// In component:
columns: MsvTableColumn[] = [
  { key: 'id', header: 'ID', sortable: true },
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'status', header: 'Status', sortable: false }
];

tableData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' }
];`;

  // Navigation Examples
  readonly paginationExample = `<msv-pagination
  [totalItems]="100"
  [pageSize]="10"
  [currentPage]="1"
  [pageSizeOptions]="[10, 25, 50, 100]"
  (pageChange)="onPageChange($event)"
></msv-pagination>`;

  readonly breadcrumbExample = `<msv-breadcrumb
  [items]="breadcrumbItems"
  [separator]="'/'"
></msv-breadcrumb>

// In component:
breadcrumbItems: BreadcrumbItem[] = [
  { label: 'Home', route: '/home' },
  { label: 'Products', route: '/products' },
  { label: 'Details' }
];`;

  readonly menuExample = `<msv-menu>
  <msv-menu-item (click)="onEdit()">
    <span>Edit</span>
  </msv-menu-item>
  <msv-menu-item (click)="onDelete()">
    <span>Delete</span>
  </msv-menu-item>
  <msv-menu-item [disabled]="true">
    <span>Disabled Item</span>
  </msv-menu-item>
</msv-menu>`;

  onDemoClick(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 2000);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard');
    });
  }
}
