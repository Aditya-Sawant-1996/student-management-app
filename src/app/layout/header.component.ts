import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { ThemeService, ThemeMode } from '../core/theme/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit, OnDestroy {
  isDark = false;
  isMenuOpen = false;
  userName = 'User';
  private sub?: Subscription;
  currentTitle = '';

  constructor(private themeService: ThemeService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.sub = new Subscription();
    const storedName =
      localStorage.getItem('systemUserName') ||
      localStorage.getItem('userName') ||
      '';
    if (storedName) {
      this.userName = storedName;
    } else {
      const storedUser = localStorage.getItem('systemUser');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed?.name) {
            this.userName = parsed.name;
          }
        } catch {
          // ignore invalid JSON
        }
      }
    }

    const themeSub = this.themeService.isDark$.subscribe((isDark) => {
      this.isDark = isDark;
    });

    const routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        const child = this.getDeepestChild(this.route);
        this.currentTitle = child.snapshot.data['title'] || '';
      });

    this.sub.add(themeSub);
    this.sub.add(routerSub);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  setTheme(mode: ThemeMode): void {
    this.themeService.setTheme(mode);
  }

  get userInitial(): string {
    const trimmed = this.userName.trim();
    return trimmed ? trimmed[0].toUpperCase() : 'U';
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.isMenuOpen = false;
  }

  private getDeepestChild(route: ActivatedRoute): ActivatedRoute {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }
}
