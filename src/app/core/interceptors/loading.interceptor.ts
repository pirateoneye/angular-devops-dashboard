import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingService } from '../services/loading.service';
import { finalize } from 'rxjs';
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const svc = inject(LoadingService);
  svc.show();
  return next(req).pipe(finalize(() => svc.hide()));
};
