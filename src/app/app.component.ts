import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/auth/auth.service';
import { LoginService } from './core/auth/login.service';
import { InstituteSettingsService } from './core/settings/institute-settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'student-management-app';

  constructor(
    private authService: AuthService,
    private loginService: LoginService,
    private instituteSettings: InstituteSettingsService
  ) {}

  ngOnInit(): void {
    this.authService.initSessionWatcher();
    this.refreshSystemUser();
  }

  private refreshSystemUser(): void {
    this.loginService.checkSystemUserExists().subscribe({
      next: (res) => {
        if (!res?.success || !res.exists || !res.user) {
          return;
        }
        try {
          localStorage.setItem('systemUser', JSON.stringify(res.user));
          if (res.user.name) {
            localStorage.setItem('systemUserName', res.user.name);
          }
        } catch {
          // ignore storage errors
        }
        if (res.user.instituteLogo) {
          this.instituteSettings.setLogo(res.user.instituteLogo);
        } else {
          this.instituteSettings.clearLogo();
        }
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}
