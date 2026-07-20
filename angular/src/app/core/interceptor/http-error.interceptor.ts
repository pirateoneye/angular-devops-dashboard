import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ActivityService } from '../../shared/service/activity.service';

/**
 * Global HTTP error interceptor.
 * Logs all HTTP errors through ActivityService and re-throws them
 * so individual components can still handle specific error cases.
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private readonly feed = inject(ActivityService);

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        const status = err.status || 0;

        // Do not log cancelled/aborted requests as errors
        if (status === 0 && err.message?.includes('cancel')) {
          return throwError(() => err);
        }

        const message =
          status > 0
            ? `${req.method} ${req.url} → ${status} ${err.statusText || ''}`
            : `${req.method} ${req.url} → Network Error`;

        this.feed.log(
          'gslb', // neutral source for generic HTTP errors
          message,
          status >= 500 ? 'err' : 'warn',
        );

        return throwError(() => err);
      }),
    );
  }
}
