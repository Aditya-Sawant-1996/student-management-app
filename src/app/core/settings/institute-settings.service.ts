import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InstituteSettingsService {
  private readonly logoStorageKey = 'instituteLogo';
  private readonly logoSubject = new BehaviorSubject<string | null>(null);
  private readonly nameStorageKey = 'instituteName';
  private readonly nameSubject = new BehaviorSubject<string>('');

  readonly logo$ = this.logoSubject.asObservable();
  readonly instituteName$ = this.nameSubject.asObservable();

  constructor() {
    const stored = this.readLogoFromStorage();
    this.logoSubject.next(stored);
    const name = this.readInstituteNameFromStorage();
    this.nameSubject.next(name);
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

  getInstituteName(): string {
    return this.nameSubject.value;
  }

  setInstituteName(name: string): boolean {
    try {
      localStorage.setItem(this.nameStorageKey, name);
      this.nameSubject.next(name);
      return true;
    } catch {
      return false;
    }
  }

  clearInstituteName(): void {
    try {
      localStorage.removeItem(this.nameStorageKey);
    } catch {
      // ignore storage errors
    }
    this.nameSubject.next('');
  }

  private readLogoFromStorage(): string | null {
    try {
      return localStorage.getItem(this.logoStorageKey);
    } catch {
      return null;
    }
  }

  private readInstituteNameFromStorage(): string {
    try {
      const stored = localStorage.getItem(this.nameStorageKey);
      if (stored) {
        return stored;
      }
      const rawUser = localStorage.getItem('systemUser');
      if (!rawUser) {
        return '';
      }
      const user = JSON.parse(rawUser) as any;
      return user?.instituteName || '';
    } catch {
      return '';
    }
  }
}
