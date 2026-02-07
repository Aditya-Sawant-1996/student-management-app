import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'theme-mode';
  private currentTheme: ThemeMode = 'light';
  private themeSubject = new BehaviorSubject<ThemeMode>(this.currentTheme);

  readonly theme$: Observable<ThemeMode> = this.themeSubject.asObservable();
  readonly isDark$: Observable<boolean> = this.theme$.pipe(
    map((mode) => mode === 'dark'),
  );

  constructor(@Inject(DOCUMENT) private document: Document) {
    const saved = (localStorage.getItem(this.storageKey) as ThemeMode | null);
    if (saved === 'dark' || saved === 'light') {
      this.setTheme(saved);
    } else {
      this.applyThemeClass();
    }
  }

  toggleTheme(): void {
    const next: ThemeMode = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  private setTheme(theme: ThemeMode): void {
    this.currentTheme = theme;
    this.themeSubject.next(theme);
    this.applyThemeClass();
    localStorage.setItem(this.storageKey, theme);
  }

  private applyThemeClass(): void {
    const root = this.document.documentElement.classList;
    if (this.currentTheme === 'dark') {
      root.add('dark');
    } else {
      root.remove('dark');
    }
  }
}
