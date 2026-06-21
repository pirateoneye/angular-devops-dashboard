import { Component, OnInit } from '@angular/core';
import { ModalInsertNameComponent } from './shared/component/modal/insert-name/modal-insert-name.component';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from './shared/service/user-service/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  user : any;

  constructor(public dialog: MatDialog, private userService: UserService) {}

  ngOnInit()
  {
    const userLocalStorage = localStorage.getItem('user');
    if(userLocalStorage)
    {
      this.userService.setNama(userLocalStorage);
      this.user = this.userService.getNama();
    }
    else {
      this.user = '-';
      this.editUsername();
    }

    this.userService.user.subscribe((user) => {
      this.user = user;
    });

  }

  editUsername() {
    this.dialog.open(ModalInsertNameComponent, {
      disableClose: true,
      panelClass: 'custom-modalbox'
    });
  }

}

