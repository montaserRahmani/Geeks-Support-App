import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { excludedInterceptorUrlRegexes } from './app-settings';

@Injectable()
export class HttpConfigInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const idToken = this.authService.idToken.getValue();
    let excluded = excludedInterceptorUrlRegexes.some(regex => regex.test(request.url));
    if (idToken && !excluded) {
      request = request.clone({ headers: request.headers.set('Authorization', `Bearer ${idToken}`) });
    }
    return next.handle(request).pipe(
      map((event: HttpEvent<any>) => {
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            this.authService.logout();
          }
        }
        return throwError(error);
      }));
  }

}