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
  
  setNama(){
    if (this.nama != '') {
      this.userService.setNama(this.nama);
      this.dialogRef.close(); // Close the dialog
    }
  }

  closeModal(){
    this.dialogRef.close(); // Close the dialog
  }

  ngOnInit(): void {
    this.nama = localStorage.getItem('user') ?? '';
    if (this.nama != '') {
      this.isLocalstorage = true;
    }
  }
  

}
