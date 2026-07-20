import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userSubject = new BehaviorSubject<string>('');
  readonly user: Observable<string> = this.userSubject.asObservable();

  constructor() {
    // Migrate legacy localStorage keys to msv- prefix (one-time, idempotent)
    const LEGACY_MAP: Record<string, string> = {
      user: 'msv-user',
      authorized: 'msv-authorized',
      'authorized-piket': 'msv-authorized-piket',
    };
    for (const [oldK, newK] of Object.entries(LEGACY_MAP)) {
      try {
        const v = localStorage.getItem(oldK);
        if (v !== null && localStorage.getItem(newK) === null) {
          localStorage.setItem(newK, v);
          localStorage.removeItem(oldK);
        }
      } catch {
        /* ignore quota / private mode */
      }
    }
  }

  setNama(nama: string) {
    if (nama) {
      this.userSubject.next(nama);
      try {
        localStorage.setItem('msv-user', nama);
      } catch {
        /* ignore quota / private mode */
      }
    }
  }

  getNama(): string {
    return this.userSubject.getValue();
  }
}
