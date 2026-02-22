import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout.component';
import { SystemUserGuard } from './core/auth/system-user.guard';
import { AuthGuard } from './core/auth/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./features/login/login.module').then(m => m.LoginModule)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [SystemUserGuard, AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'student',
        loadChildren: () =>
          import('./features/student/student.module').then(m => m.StudentModule)
      },
      {
        path: 'subject',
        loadChildren: () =>
          import('./features/subject/subject.module').then(m => m.SubjectModule)
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.module').then(m => m.SettingsModule)
      },
      {
			path: 'fees',
			loadChildren: () =>
				import('./features/fees/fees.module').then(m => m.FeesModule)
		},
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
