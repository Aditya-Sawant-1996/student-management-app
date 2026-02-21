import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root'
})
export class SystemUserGuard implements CanActivate {
  constructor(private loginService: LoginService, private router: Router) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.loginService.checkSystemUserExists().pipe(
      map((res) => {
        if (res.exists) {
          return true;
        }
        return this.router.createUrlTree(['/login']);
      }),
      catchError(() => of(this.router.createUrlTree(['/login'])))
    );
  }
}
