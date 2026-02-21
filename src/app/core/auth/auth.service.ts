import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CommonFunctionService } from '../common/common-function.service';

const TOKEN_KEY = 'authToken';
const TOKEN_EXPIRES_KEY = 'authTokenExpiresAt';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private logoutTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private router: Router,
    private commonFunction: CommonFunctionService
  ) {}

  setSession(token: string, expiresAt: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRES_KEY, expiresAt);
    this.scheduleLogout(expiresAt);
  }

  clearSession(options?: { showMessage?: boolean; navigate?: boolean }): void {
    const showMessage = options?.showMessage ?? false;
    const navigate = options?.navigate ?? true;
    this.clearTimer();
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRES_KEY);
    } catch {
      // ignore storage errors
    }
    if (showMessage) {
      this.commonFunction.showToast(
        'Session expired. Please login again.',
        'error'
      );
    }
    if (navigate) {
      this.router.navigate(['/login']);
    }
  }

  initSessionWatcher(): void {
    const state = this.getSessionState();
    if (state === 'valid') {
      const expiresAt = localStorage.getItem(TOKEN_EXPIRES_KEY) || '';
      this.scheduleLogout(expiresAt);
      return;
    }
    if (state === 'expired') {
      this.clearSession({ showMessage: true, navigate: true });
    }
  }

  getSessionState(): 'valid' | 'missing' | 'expired' | 'invalid' {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiresAt = localStorage.getItem(TOKEN_EXPIRES_KEY);
    if (!token || !expiresAt) {
      return 'missing';
    }
    const expMs = Date.parse(expiresAt);
    if (Number.isNaN(expMs)) {
      return 'invalid';
    }
    if (Date.now() >= expMs) {
      return 'expired';
    }
    return 'valid';
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private scheduleLogout(expiresAt: string): void {
    this.clearTimer();
    const expMs = Date.parse(expiresAt);
    if (Number.isNaN(expMs)) {
      return;
    }
    const delay = expMs - Date.now();
    if (delay <= 0) {
      this.clearSession({ showMessage: true, navigate: true });
      return;
    }
    this.logoutTimer = setTimeout(() => {
      this.clearSession({ showMessage: true, navigate: true });
    }, delay);
  }

  private clearTimer(): void {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = undefined;
    }
  }
}
