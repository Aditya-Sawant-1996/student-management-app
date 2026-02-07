import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ThemeService } from '../core/theme/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit, OnDestroy {
  isDark = false;
  private sub?: Subscription;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.sub = this.themeService.isDark$.subscribe((isDark) => {
      this.isDark = isDark;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
