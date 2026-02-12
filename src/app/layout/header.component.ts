import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { ThemeService } from '../core/theme/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit, OnDestroy {
  isDark = false;
  private sub?: Subscription;
  currentTitle = '';

  constructor(private themeService: ThemeService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.sub = new Subscription();

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

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  private getDeepestChild(route: ActivatedRoute): ActivatedRoute {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }
}
