import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UserService } from 'src/app/shared/service/user-service/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  selector: 'modal-insert-name',
  templateUrl: './modal-insert-name.component.html',
  styleUrls: ['./modal-insert-name.component.css', '../../../../app.component.css']
})
export class ModalInsertNameComponent implements OnInit {

  nama: string = '';
  isLocalstorage = false;

  constructor(private userService: UserService, public dialogRef: MatDialogRef<ModalInsertNameComponent>) { }
  
  setNama(): void {
    if (this.nama.trim().length > 0) {
      this.userService.setNama(this.nama.trim());
      this.dialogRef.close();
    }
  }

  skipName(): void {
    this.dialogRef.close();
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  ngOnInit(): void {
    this.nama = this.userService.getNama();
    this.isLocalstorage = this.nama !== '';
  }
}
