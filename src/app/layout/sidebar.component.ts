import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { InstituteSettingsService } from '../core/settings/institute-settings.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  logoUrl$: Observable<string | null>;

  constructor(
    private authService: AuthService,
    private instituteSettings: InstituteSettingsService
  ) {
    this.logoUrl$ = this.instituteSettings.logo$;
  }

  onLogout(): void {
    try {
      sessionStorage.clear();
    } catch {
      // ignore storage errors
    }
    this.authService.clearSession({ showMessage: false, navigate: true });
  }
}
