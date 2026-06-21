import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';

// Original Components
import { MsvInputComponent } from './msv-input/msv-input.component';
import { MsvSelectComponent } from './msv-select/msv-select.component';
import { MsvTextareaComponent } from './msv-textarea/msv-textarea.component';
import { MsvButtonComponent } from './msv-button/msv-button.component';
import { MsvStatusBadgeComponent } from './msv-status-badge/msv-status-badge.component';
import { MsvResponsePanelComponent } from './msv-response-panel/msv-response-panel.component';

// Form Controls
import { MsvCheckboxComponent } from './msv-checkbox/msv-checkbox.component';
import { MsvCheckboxGroupComponent } from './msv-checkbox-group/msv-checkbox-group.component';
import { MsvRadioComponent } from './msv-radio/msv-radio.component';
import { MsvToggleComponent } from './msv-toggle/msv-toggle.component';
import { MsvNumberComponent } from './msv-number/msv-number.component';
import { MsvDatepickerComponent } from './msv-datepicker/msv-datepicker.component';
import { MsvFileUploadComponent } from './msv-file-upload/msv-file-upload.component';

// Feedback
import { MsvSpinnerComponent } from './msv-spinner/msv-spinner.component';
import { MsvProgressComponent } from './msv-progress/msv-progress.component';
import { MsvAlertComponent } from './msv-alert/msv-alert.component';
import { MsvTooltipDirective, MsvTooltipContainerComponent } from './msv-tooltip/msv-tooltip.directive';
import { MsvToastService } from './msv-toast/msv-toast.service';
import { MsvToastComponent } from './msv-toast/msv-toast.component';
import { MsvToastContainerComponent } from './msv-toast/msv-toast-container.component';
import { MsvModalService } from './msv-modal/msv-modal.service';
import { MsvModalComponent } from './msv-modal/msv-modal.component';

// Layout
import { MsvCardComponent } from './msv-card/msv-card.component';
import { MsvDividerComponent } from './msv-divider/msv-divider.component';
import { MsvTabsComponent } from './msv-tabs/msv-tabs.component';
import { MsvTabComponent } from './msv-tabs/msv-tab.component';
import { MsvAccordionComponent } from './msv-accordion/msv-accordion.component';
import { MsvAccordionItemComponent } from './msv-accordion/msv-accordion-item.component';

// Data Display
import { MsvAvatarComponent } from './msv-avatar/msv-avatar.component';
import { MsvTagComponent } from './msv-tag/msv-tag.component';
import { MsvBadgeComponent } from './msv-badge/msv-badge.component';
import { MsvListComponent } from './msv-list/msv-list.component';
import { MsvListItemComponent } from './msv-list/msv-list-item.component';
import { MsvTableComponent } from './msv-table/msv-table.component';

// Navigation
import { MsvPaginationComponent } from './msv-pagination/msv-pagination.component';
import { MsvBreadcrumbComponent } from './msv-breadcrumb/msv-breadcrumb.component';
import { MsvMenuComponent } from './msv-menu/msv-menu.component';
import { MsvMenuItemComponent } from './msv-menu/msv-menu-item.component';
import { MsvMenuTriggerDirective } from './msv-menu/msv-menu-trigger.directive';

@NgModule({
  declarations: [
    // Original Components
    MsvInputComponent,
    MsvSelectComponent,
    MsvTextareaComponent,
    MsvButtonComponent,
    MsvStatusBadgeComponent,
    MsvResponsePanelComponent,
    // Form Controls
    MsvCheckboxComponent,
    MsvCheckboxGroupComponent,
    MsvRadioComponent,
    MsvToggleComponent,
    MsvNumberComponent,
    MsvDatepickerComponent,
    MsvFileUploadComponent,
    // Feedback
    MsvSpinnerComponent,
    MsvProgressComponent,
    MsvAlertComponent,
    MsvTooltipDirective,
    MsvTooltipContainerComponent,
    MsvToastComponent,
    MsvToastContainerComponent,
    MsvModalComponent,
    // Layout
    MsvCardComponent,
    MsvDividerComponent,
    MsvTabsComponent,
    MsvTabComponent,
    MsvAccordionComponent,
    MsvAccordionItemComponent,
    // Data Display
    MsvAvatarComponent,
    MsvBadgeComponent,
    MsvListComponent,
    MsvListItemComponent,
    MsvTableComponent,
    // Navigation
    MsvPaginationComponent,
    MsvMenuComponent,
    MsvMenuItemComponent,
    MsvMenuTriggerDirective,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    OverlayModule,
    PortalModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    // Standalone components
    MsvTagComponent,
    MsvBreadcrumbComponent,
  ],
  exports: [
    // Original Components
    MsvInputComponent,
    MsvSelectComponent,
    MsvTextareaComponent,
    MsvButtonComponent,
    MsvStatusBadgeComponent,
    MsvResponsePanelComponent,
    // Form Controls
    MsvCheckboxComponent,
    MsvCheckboxGroupComponent,
    MsvRadioComponent,
    MsvToggleComponent,
    MsvNumberComponent,
    MsvDatepickerComponent,
    MsvFileUploadComponent,
    // Feedback
    MsvSpinnerComponent,
    MsvProgressComponent,
    MsvAlertComponent,
    MsvTooltipDirective,
    MsvTooltipContainerComponent,
    MsvToastComponent,
    MsvToastContainerComponent,
    MsvModalComponent,
    // Layout
    MsvCardComponent,
    MsvDividerComponent,
    MsvTabsComponent,
    MsvTabComponent,
    MsvAccordionComponent,
    MsvAccordionItemComponent,
    // Data Display
    MsvAvatarComponent,
    MsvTagComponent,
    MsvBadgeComponent,
    MsvListComponent,
    MsvListItemComponent,
    MsvTableComponent,
    // Navigation
    MsvPaginationComponent,
    MsvBreadcrumbComponent,
    MsvMenuComponent,
    MsvMenuItemComponent,
    MsvMenuTriggerDirective,
  ],
  providers: [MsvToastService, MsvModalService],
})
export class MsvFormsModule {}
