import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { catchError } from 'rxjs';
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const svc = inject(NotificationService);
  return next(req).pipe(catchError(err => {
    svc.show(err.error?.message || err.message || 'Request failed', 'error');
    throw err;
  }));
};
