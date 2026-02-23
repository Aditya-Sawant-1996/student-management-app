import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InstituteSettingsService {
  private readonly logoStorageKey = 'instituteLogo';
  private readonly logoSubject = new BehaviorSubject<string | null>(null);

  readonly logo$ = this.logoSubject.asObservable();

  constructor() {
    const stored = this.readLogoFromStorage();
    this.logoSubject.next(stored);
  }

  getLogo(): string | null {
    return this.logoSubject.value;
  }

  setLogo(dataUrl: string): boolean {
    try {
      localStorage.setItem(this.logoStorageKey, dataUrl);
      this.logoSubject.next(dataUrl);
      return true;
    } catch {
      return false;
    }
  }

  clearLogo(): void {
    try {
      localStorage.removeItem(this.logoStorageKey);
    } catch {
      // ignore storage errors
    }
    this.logoSubject.next(null);
  }

  private readLogoFromStorage(): string | null {
    try {
      return localStorage.getItem(this.logoStorageKey);
    } catch {
      return null;
    }
  }
}
