import { Component } from '@angular/core';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  constructor(private authService: AuthService) {}

  onLogout(): void {
    try {
      sessionStorage.clear();
    } catch {
      // ignore storage errors
    }
    this.authService.clearSession({ showMessage: false, navigate: true });
  }
}
