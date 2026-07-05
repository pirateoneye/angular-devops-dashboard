import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  standalone: true,
  imports: [MatDialogModule],
  selector: 'modal-confirmation',
  templateUrl: './modal-confirmation.component.html',
  styleUrls: ['./modal-confirmation.component.css'],
})
export class ModalConfirmationComponent {
  data = inject(MAT_DIALOG_DATA);
}
