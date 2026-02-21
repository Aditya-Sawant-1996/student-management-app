import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'student-management-app';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.initSessionWatcher();
  }
}
