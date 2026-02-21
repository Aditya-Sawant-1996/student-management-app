import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    const state = this.authService.getSessionState();
    if (state === 'valid') {
      return true;
    }

    if (state === 'expired') {
      this.authService.clearSession({ showMessage: true, navigate: false });
    }

    return this.router.createUrlTree(['/login']);
  }
}
