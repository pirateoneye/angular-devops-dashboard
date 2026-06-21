import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  user = this.userSubject.asObservable();

  setNama(nama: string) {
    if (nama) {
      this.userSubject.next(nama);
      localStorage.setItem('user', nama);
    }
  }

  getNama() {
    return this.userSubject.getValue();
  }

  constructor() { }
}
